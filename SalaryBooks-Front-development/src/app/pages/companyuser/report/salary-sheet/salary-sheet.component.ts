import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFiilterOptions from 'src/app/models/TableFiilterOptions';
import swal from 'sweetalert2';

import jsPDF from 'jspdf';
const pdfMake = require('pdfmake/build/pdfmake')
const pdfFonts = require('pdfmake/build/vfs_fonts')
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake')
import { _salarySheetTempMaster } from '../_salarySheetTempMaster';

@Component({
    selector: 'app-companyuser-salary-sheet-report',
    templateUrl: './salary-sheet.component.html',
    styleUrls: ['./salary-sheet.component.css']
})
export class CMPSalarySheetReportComponent implements OnInit {
    @ViewChild('salarysheetreporttable', { static: false }) el!: ElementRef;

    employeeListFilter: any = {};
    filterForm: UntypedFormGroup;
    templateForm: UntypedFormGroup;
    templateSelectionForm: UntypedFormGroup;
    generateReportForm: UntypedFormGroup;
    empSalaryHoldForm: UntypedFormGroup;

    monthMaster: any[] = [];
    yearMaster: any[] = [];
    employees: any[] = [];
    sheetTemplate: any[] = _salarySheetTempMaster;
    _tempSheetTemplate: any[] = this.sheetTemplate;
    sheetTemplateMaster: any[] = [];
    departmentMaster: any[] = [];
    designationMaster: any[] = [];
    branchMaster: any[] = [];
    hodMaster: any[] = [];
    holdTypeMaster: any[] = [];
    holdedEmpSalaries: any[] = [];

    empReportData: any[] = [];
    empReportGenerated: Boolean = false;
    empReportTempData: any = {
        'master_head_includes': [],
        'head_includes': [],
        'extra_earning_data': [],
    };

    rowCheckedAll: Boolean = false;
    checkedRowIds: any[] = [];
    uncheckedRowIds: any[] = [];

    Global = Global;
    paginationOptions: PaginationOptions = Global.resetPaginationOption();
    tableFilterOptions: TableFiilterOptions = Global.resetTableFilterOptions();
    holdedSalarypaginationOptions: PaginationOptions = Global.resetPaginationOption();

    constructor(
        private titleService: Title,
        private toastr: ToastrService,
        protected companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
        private datePipe: DatePipe
    ) {
        this.filterForm = formBuilder.group({
            month: [null, Validators.compose([Validators.required])],
            year: [null, Validators.compose([Validators.required])],

            department: [null],
            designation: [null],
            branch: [null],
            hod: [null],

            department_id: [null],
            designation_id: [null],
            branch_id: [null],
            hod_id: [null],
        });

        this.monthMaster = [
            { index: 0, value: 1, description: "January", days: 31 },
            { index: 1, value: 2, description: "February", days: 28 },
            { index: 2, value: 3, description: "March", days: 31 },
            { index: 3, value: 4, description: "April", days: 30 },
            { index: 4, value: 5, description: "May", days: 31 },
            { index: 5, value: 6, description: "June", days: 30 },
            { index: 6, value: 7, description: "July", days: 31 },
            { index: 7, value: 8, description: "August", days: 31 },
            { index: 8, value: 9, description: "September", days: 30 },
            { index: 9, value: 10, description: "October", days: 31 },
            { index: 10, value: 11, description: "November", days: 30 },
            { index: 11, value: 12, description: "December", days: 31 },
        ];

        let currentYear = new Date().getFullYear();
        this.yearMaster = [];
        for (let index = 4; index >= 0; index--) {
            this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
        }

        // this.empReportData = [{"emp_data":{"_id":"623b0aa7ce3c680db0a6321b","emp_id":"DJ-559","emp_first_name":"emp002","emp_last_name":"lname","emp_emp_dob":"2022-03-16T00:00:00.000Z","emp_pan_no":"QWEQW1234Q","emp_aadhar_no":"123123123121","emp_email_id":"emp002@yopmail.com","new_pf_no":"NA","esic_no":"NA","date_of_join":"2022-02-09","sex":"NA","EPF":"yes","EPS":"yes","Restrict_PF":"yes","ESIC":"NO","Reg_Type":"monthly","emp_uan_no":"NA","attendance_summaries":{"_id":"62e135218b7329c9e6a7c586","attendance_month":"0","attendance_year":"2022","emp_id":"DJ-559","__v":0,"adjust_day":"0","corporate_id":"ivn123","paydays":"0","total_absent":"0","total_attendance":"0","total_cl":"0","total_gl":"0","total_hl":"0","total_kb":0,"total_late":"0","total_lop":"00","total_ml":0,"total_overtime":"0","total_pl":"0","total_wo":"0","updated_at":"2022-07-27T12:52:49.731Z"}},"heads":[],"heads_rate":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":7250},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":21750}],"epf_data":{"emoloyee_contribution":0,"total_employer_contribution":0,"emoloyer_pf_contribution":0,"emoloyer_eps_contribution":0,"emoloyer_edlis_contribution":0,"emoloyer_epf_admin_contribution":0,"emoloyer_edlis_admin_contribution":0},"epf_data_rate":{"emoloyee_contribution_rate":1800,"total_employer_contribution_rate":1800,"emoloyer_pf_contribution_rate":551,"emoloyer_eps_contribution_rate":1250,"emoloyer_edlis_contribution_rate":75,"emoloyer_epf_admin_contribution_rate":75,"emoloyer_edlis_admin_contribution_rate":0},"p_tax_amount":0,"p_tax_amount_rate":0,"esic_data":{"emoloyee_contribution":0,"emoloyer_contribution":0},"esic_data_rate":{"emoloyee_contribution_rate":0,"emoloyer_contribution_rate":0},"restricted_pf_wages":null,"total_pf_wages":null,"edlis_wages":null,"eps_wages":null,"total_esi_wages_bucket":0,"total_esi_wages":0,"total_pt_wages":0,"total_tds_wages":0,"total_ot_wages":0,"total_bonus_wages":0,"total_gratuity_wages":0,"bonus_amount":null,"restricted_pf_wages_rate":null,"total_pf_wages_rate":null,"edlis_wages_rate":null,"eps_wages_rate":null,"total_esi_wages_bucket_rate":29000,"total_esi_wages_rate":0,"total_pt_wages_rate":29000,"total_tds_wages_rate":0,"total_ot_wages_rate":0,"total_bonus_wages_rate":0,"total_gratuity_wages_rate":0,"gratuity_amount":0,"total_tds_amount":0,"extra_earning_data":[],"extra_deduction_data":[],"advance_recovered":0,"employee_advances_data":{"advance_id":0,"partial_pending":0,"full_pending":0,"recovered_advance_data":0,"advance_start":0,"further_advance":0,"closing_advance":0},"total_ot_amount":0,"incentive_val":"IMNC","incentive_advance_val":0,"gross_earning":0,"gross_deduct":0,"net_take_home":0,"voluntary_pf_amount":0,"total_employeer_pf_contribution":0,"total_employeer_esic_contribution":0,"ctc_amount":0,"gross_earning_rate":29000,"gross_deduct_rate":1800,"net_take_home_rate":27200,"voluntary_pf_amount_rate":0,"total_employeer_pf_contribution_rate":1950,"total_employeer_esic_contribution_rate":0,"ctc_amount_rate":30950},{"emp_data":{"_id":"6242ffc36cc3e7217f0e53c1","emp_id":"emp05","emp_first_name":"JOHN","emp_last_name":"DOE","emp_emp_dob":"2022-03-23T04:00:00.000Z","emp_pan_no":"QWEQW1234Q","emp_aadhar_no":"1.23E+11","emp_email_id":"emp01@yopmail.com","new_pf_no":"123123","esic_no":"123123123","date_of_join":"3/19/2022","sex":"NA","EPF":"no","Restrict_PF":"yes","ESIC":"NO","Reg_Type":"wholeday","emp_uan_no":"12312313","attendance_summaries":{"_id":"62a06b6e717e380f393eac8b","attendance_month":"0","attendance_year":"2022","emp_id":"emp05","__v":0,"corporate_id":"ivn123","paydays":"22","total_absent":"4","total_attendance":"14","total_cl":"1","total_gl":"0","total_hl":"0","total_kb":0,"total_late":"0","total_lop":"9","total_ml":0,"total_overtime":"0","total_pl":"1","total_wo":"6","updated_at":"2022-06-08T09:27:10.983Z"}},"heads":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":39426},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":118279}],"heads_rate":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":55556},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":166667}],"epf_data":{"emoloyee_contribution":0,"total_employer_contribution":0,"emoloyer_pf_contribution":0,"emoloyer_eps_contribution":0,"emoloyer_edlis_contribution":0,"emoloyer_epf_admin_contribution":0,"emoloyer_edlis_admin_contribution":0},"epf_data_rate":{"emoloyee_contribution_rate":0,"total_employer_contribution_rate":0,"emoloyer_pf_contribution_rate":0,"emoloyer_eps_contribution_rate":0,"emoloyer_edlis_contribution_rate":0,"emoloyer_epf_admin_contribution_rate":0,"emoloyer_edlis_admin_contribution_rate":0},"p_tax_amount":0,"p_tax_amount_rate":0,"esic_data":{"emoloyee_contribution":0,"emoloyer_contribution":0},"esic_data_rate":{"emoloyee_contribution_rate":0,"emoloyer_contribution_rate":0},"restricted_pf_wages":15000,"total_pf_wages":157706,"edlis_wages":null,"eps_wages":null,"total_esi_wages_bucket":157706,"total_esi_wages":0,"total_pt_wages":157706,"total_tds_wages":0,"total_ot_wages":0,"total_bonus_wages":0,"total_gratuity_wages":0,"bonus_amount":null,"restricted_pf_wages_rate":15000,"total_pf_wages_rate":222222,"edlis_wages_rate":null,"eps_wages_rate":null,"total_esi_wages_bucket_rate":222222,"total_esi_wages_rate":0,"total_pt_wages_rate":222222,"total_tds_wages_rate":0,"total_ot_wages_rate":0,"total_bonus_wages_rate":0,"total_gratuity_wages_rate":0,"gratuity_amount":0,"total_tds_amount":0,"extra_earning_data":[],"extra_deduction_data":[],"advance_recovered":0,"employee_advances_data":{"advance_id":0,"partial_pending":0,"full_pending":0,"recovered_advance_data":0,"advance_start":0,"further_advance":0,"closing_advance":0},"total_ot_amount":0,"incentive_val":"IMNC","incentive_advance_val":0,"gross_earning":157706,"gross_deduct":0,"net_take_home":157706,"voluntary_pf_amount":0,"total_employeer_pf_contribution":0,"total_employeer_esic_contribution":0,"ctc_amount":157706,"gross_earning_rate":222222,"gross_deduct_rate":0,"net_take_home_rate":222222,"voluntary_pf_amount_rate":0,"total_employeer_pf_contribution_rate":0,"total_employeer_esic_contribution_rate":0,"ctc_amount_rate":222222},{"emp_data":{"_id":"6242ffc36cc3e7217f0e53c2","emp_id":"emp1001","emp_first_name":"Jimmy","emp_last_name":"Bond","emp_emp_dob":"2022-03-23T00:00:00.000Z","emp_pan_no":"QWEQW1234Q","emp_aadhar_no":"123113123312","emp_email_id":"emp02@yopmail.com","new_pf_no":"123123","esic_no":"123123123","date_of_join":"2022-06-07","sex":"NA","EPF":"no","EPS":"no","Restrict_PF":"yes","ESIC":"NO","Reg_Type":"wholeday","emp_uan_no":"12312313","attendance_summaries":{"_id":"62a075a3a9ff6439d7198aa9","attendance_month":"0","attendance_year":"2022","emp_id":"emp1001","__v":0,"corporate_id":"ivn123","paydays":"22","total_absent":"1","total_attendance":"14","total_cl":"0","total_gl":"0","total_hl":"0","total_kb":0,"total_late":"23","total_lop":"7","total_ml":0,"total_overtime":"0","total_pl":"0","total_wo":"8","updated_at":"2022-06-08T10:10:43.765Z","adjust_day":"0"}},"heads":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":6050},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":18150}],"heads_rate":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":8250},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":24750}],"epf_data":{"emoloyee_contribution":0,"total_employer_contribution":0,"emoloyer_pf_contribution":0,"emoloyer_eps_contribution":0,"emoloyer_edlis_contribution":0,"emoloyer_epf_admin_contribution":0,"emoloyer_edlis_admin_contribution":0},"epf_data_rate":{"emoloyee_contribution_rate":0,"total_employer_contribution_rate":0,"emoloyer_pf_contribution_rate":0,"emoloyer_eps_contribution_rate":0,"emoloyer_edlis_contribution_rate":0,"emoloyer_epf_admin_contribution_rate":0,"emoloyer_edlis_admin_contribution_rate":0},"p_tax_amount":0,"p_tax_amount_rate":0,"esic_data":{"emoloyee_contribution":0,"emoloyer_contribution":0},"esic_data_rate":{"emoloyee_contribution_rate":0,"emoloyer_contribution_rate":0},"restricted_pf_wages":15000,"total_pf_wages":24200,"edlis_wages":null,"eps_wages":null,"total_esi_wages_bucket":24200,"total_esi_wages":0,"total_pt_wages":24200,"total_tds_wages":0,"total_ot_wages":0,"total_bonus_wages":0,"total_gratuity_wages":0,"bonus_amount":null,"restricted_pf_wages_rate":15000,"total_pf_wages_rate":33000,"edlis_wages_rate":null,"eps_wages_rate":null,"total_esi_wages_bucket_rate":33000,"total_esi_wages_rate":0,"total_pt_wages_rate":33000,"total_tds_wages_rate":0,"total_ot_wages_rate":0,"total_bonus_wages_rate":0,"total_gratuity_wages_rate":0,"gratuity_amount":0,"total_tds_amount":0,"extra_earning_data":[],"extra_deduction_data":[],"advance_recovered":0,"employee_advances_data":{"advance_id":0,"partial_pending":0,"full_pending":0,"recovered_advance_data":0,"advance_start":0,"further_advance":0,"closing_advance":0},"total_ot_amount":0,"incentive_val":"IMNC","incentive_advance_val":0,"gross_earning":24200,"gross_deduct":0,"net_take_home":24200,"voluntary_pf_amount":0,"total_employeer_pf_contribution":0,"total_employeer_esic_contribution":0,"ctc_amount":24200,"gross_earning_rate":33000,"gross_deduct_rate":0,"net_take_home_rate":33000,"voluntary_pf_amount_rate":0,"total_employeer_pf_contribution_rate":0,"total_employeer_esic_contribution_rate":0,"ctc_amount_rate":33000},{"emp_data":{"_id":"6242ff676cc3e7217f0e53bb","emp_id":"emp0012","emp_first_name":"emp01","emp_last_name":"lname","emp_emp_dob":"2022-03-23T04:00:00.000Z","emp_pan_no":"QWEQW1234Q","emp_aadhar_no":"1.23E+11","emp_email_id":"emp01@yopmail.com","new_pf_no":"123123","esic_no":"123123123","date_of_join":"3/19/2022","sex":"NA","EPF":"yes","EPS":"yes","Restrict_PF":"yes","ESIC":"NO","Reg_Type":"monthly","emp_uan_no":"12312313","attendance_summaries":{"_id":"62a06b4f717e380f393eac8a","attendance_month":"0","attendance_year":"2022","emp_id":"emp0012","__v":0,"corporate_id":"ivn123","paydays":"1","total_absent":"0","total_attendance":"1","total_cl":"0","total_gl":"0","total_hl":"0","total_kb":0,"total_late":"1","total_lop":"25","total_ml":0,"total_overtime":"0","total_pl":"0","total_wo":"0","updated_at":"2022-06-08T09:26:39.528Z","adjust_day":"0"}},"heads":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":196},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":589}],"heads_rate":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":5500},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":16500}],"epf_data":{"emoloyee_contribution":94,"total_employer_contribution":94,"emoloyer_pf_contribution":29,"emoloyer_eps_contribution":65,"emoloyer_edlis_contribution":4,"emoloyer_epf_admin_contribution":4,"emoloyer_edlis_admin_contribution":0},"epf_data_rate":{"emoloyee_contribution_rate":1800,"total_employer_contribution_rate":1800,"emoloyer_pf_contribution_rate":551,"emoloyer_eps_contribution_rate":1250,"emoloyer_edlis_contribution_rate":75,"emoloyer_epf_admin_contribution_rate":75,"emoloyer_edlis_admin_contribution_rate":0},"p_tax_amount":0,"p_tax_amount_rate":0,"esic_data":{"emoloyee_contribution":6,"emoloyer_contribution":26},"esic_data_rate":{"emoloyee_contribution_rate":0,"emoloyer_contribution_rate":0},"restricted_pf_wages":null,"total_pf_wages":null,"edlis_wages":null,"eps_wages":null,"total_esi_wages_bucket":786,"total_esi_wages":0,"total_pt_wages":786,"total_tds_wages":0,"total_ot_wages":0,"total_bonus_wages":0,"total_gratuity_wages":0,"bonus_amount":null,"restricted_pf_wages_rate":null,"total_pf_wages_rate":null,"edlis_wages_rate":null,"eps_wages_rate":null,"total_esi_wages_bucket_rate":22000,"total_esi_wages_rate":0,"total_pt_wages_rate":22000,"total_tds_wages_rate":0,"total_ot_wages_rate":0,"total_bonus_wages_rate":0,"total_gratuity_wages_rate":0,"gratuity_amount":0,"total_tds_amount":0,"extra_earning_data":[],"extra_deduction_data":[],"advance_recovered":0,"employee_advances_data":{"advance_id":"62bb019e55c654230efe7b1a","partial_pending":0,"full_pending":0,"recovered_advance_data":0,"advance_start":10000,"further_advance":0,"closing_advance":10000},"total_ot_amount":0,"incentive_val":"IMNC","incentive_advance_val":0,"gross_earning":786,"gross_deduct":100,"net_take_home":686,"voluntary_pf_amount":0,"total_employeer_pf_contribution":102,"total_employeer_esic_contribution":26,"ctc_amount":913,"gross_earning_rate":22000,"gross_deduct_rate":1800,"net_take_home_rate":20200,"voluntary_pf_amount_rate":0,"total_employeer_pf_contribution_rate":1950,"total_employeer_esic_contribution_rate":0,"ctc_amount_rate":23950},{"emp_data":{"_id":"6282306f48a91a7fce531fd1","emp_id":"emp1004","emp_first_name":"Debasis","emp_last_name":"Jana","emp_emp_dob":"2021-11-22T00:00:00.000Z","emp_pan_no":"1234567890","emp_aadhar_no":"1234567890","emp_email_id":"debasisjana7@gmail.com","new_pf_no":"NA","esic_no":"NA","date_of_join":"2022-05-04","sex":"NA","EPF":"yes","EPS":"no","Restrict_PF":"yes","ESIC":"NO","Reg_Type":"wholeday","emp_uan_no":"NA","attendance_summaries":{"_id":"62a06b80717e380f393eac8c","attendance_month":"0","attendance_year":"2022","emp_id":"emp1004","__v":0,"corporate_id":"ivn123","paydays":"26","total_absent":"0","total_attendance":"18","total_cl":"0","total_gl":"0","total_hl":"0","total_kb":0,"total_late":0,"total_lop":"2","total_ml":0,"total_overtime":"0","total_pl":"0","total_wo":"8","updated_at":"2022-06-08T09:27:28.629Z"}},"heads":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":10484},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":31452}],"heads_rate":[{"head_id":"61e7ad3c312f79f752a5b1d4","head_title":"House Rent","head_rate_type":"percent","head_rate":"25","amount":12500},{"head_id":"6196536c730cfc6c51e280c4","head_title":"Basic (BA)","head_rate_type":"percent","head_rate":"75","amount":37500}],"epf_data":{"emoloyee_contribution":1800,"total_employer_contribution":1800,"emoloyer_pf_contribution":1800,"emoloyer_eps_contribution":0,"emoloyer_edlis_contribution":75,"emoloyer_epf_admin_contribution":75,"emoloyer_edlis_admin_contribution":0},"epf_data_rate":{"emoloyee_contribution_rate":1800,"total_employer_contribution_rate":1800,"emoloyer_pf_contribution_rate":1800,"emoloyer_eps_contribution_rate":0,"emoloyer_edlis_contribution_rate":75,"emoloyer_epf_admin_contribution_rate":75,"emoloyer_edlis_admin_contribution_rate":0},"p_tax_amount":0,"p_tax_amount_rate":0,"esic_data":{"emoloyee_contribution":0,"emoloyer_contribution":0},"esic_data_rate":{"emoloyee_contribution_rate":0,"emoloyer_contribution_rate":0},"restricted_pf_wages":null,"total_pf_wages":null,"edlis_wages":null,"eps_wages":null,"total_esi_wages_bucket":41936,"total_esi_wages":0,"total_pt_wages":41935,"total_tds_wages":0,"total_ot_wages":0,"total_bonus_wages":0,"total_gratuity_wages":0,"bonus_amount":null,"restricted_pf_wages_rate":null,"total_pf_wages_rate":null,"edlis_wages_rate":null,"eps_wages_rate":null,"total_esi_wages_bucket_rate":50000,"total_esi_wages_rate":0,"total_pt_wages_rate":50000,"total_tds_wages_rate":0,"total_ot_wages_rate":0,"total_bonus_wages_rate":0,"total_gratuity_wages_rate":0,"gratuity_amount":0,"total_tds_amount":0,"extra_earning_data":[],"extra_deduction_data":[],"advance_recovered":0,"employee_advances_data":{"advance_id":"62bc266d3dac2ab75ad14b90","partial_pending":0,"full_pending":0,"recovered_advance_data":0,"advance_start":1000,"further_advance":0,"closing_advance":1000},"total_ot_amount":0,"incentive_val":"IMNC","incentive_advance_val":0,"gross_earning":41935,"gross_deduct":1800,"net_take_home":40135,"voluntary_pf_amount":0,"total_employeer_pf_contribution":1950,"total_employeer_esic_contribution":0,"ctc_amount":43885,"gross_earning_rate":50000,"gross_deduct_rate":1800,"net_take_home_rate":48200,"voluntary_pf_amount_rate":0,"total_employeer_pf_contribution_rate":1950,"total_employeer_esic_contribution_rate":0,"ctc_amount_rate":51950}];
        // this.empReportGenerated = true;
        // this.restoreReportTempData();

        this.templateForm = formBuilder.group({
            'template_name': [null, Validators.compose([Validators.required])],
        });

        this.templateSelectionForm = formBuilder.group({
            'template': [null, Validators.compose([Validators.required])],
        });

        this.generateReportForm = formBuilder.group({
            'template': [null, Validators.compose([Validators.required])],
        });

        this.empSalaryHoldForm = formBuilder.group({
            'emp_details': [null],
            'hold_type': [null, Validators.compose([Validators.required])],
        });

        this.holdTypeMaster = [
            { 'value': "salaryWithCom", 'description': "Salary with Compliance" },
            { 'value': "salary", 'description': "Salary" },
        ];
    }

    async ngOnInit() {
        this.titleService.setTitle("Run Payroll - " + Global.AppName);

        this.filterForm.patchValue({
            'month': this.monthMaster.find((obj: any) => {
                return obj.index == 0
                return obj.index == new Date().getMonth()
            }) ?? null,

            'year': this.yearMaster.find((obj: any) => {
                // return obj.value == 2022
                return obj.value == new Date().getFullYear()
            }) ?? null,
        })

        await this.fetchMasters();
        await this.fetchEmployees();
        await this.fetchSettingsTemplate();
    }

    fetchMasters() {
        return new Promise((resolve, reject) => {
            this.spinner.show();
            this.companyuserService.getEmployeeMaster().subscribe((res: any) => {
                if (res.status == 'success') {
                    this.branchMaster = [];
                    if (res.masters.branch?.company_branch && Array.isArray(res.masters.branch?.company_branch)) {
                        res.masters.branch?.company_branch.forEach((element: any) => {
                            this.branchMaster.push({ id: element._id, description: element.branch_name })
                        });
                    }

                    if (res.masters.designation && Array.isArray(res.masters.designation)) {
                        this.designationMaster = [];
                        res.masters.designation.forEach((element: any) => {
                            this.designationMaster.push({ id: element._id, description: element.designation_name })
                        });
                    }

                    if (res.masters.department && Array.isArray(res.masters.department)) {
                        this.departmentMaster = [];
                        res.masters.department.forEach((element: any) => {
                            this.departmentMaster.push({ id: element._id, description: element.department_name })
                        });
                    }

                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
                resolve(true);
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(true);
            });
        })
    }

    /**
     * =========================
     * FETCH EMPLOYEES FUNCTIONS
     * =========================
     * =========================
     */
    printValues(e:any){
        // console.log(e);

    }

    // employeeListFilter: any = {};
    filterDataTable(payload: any) {
      this.employeeListFilter = payload;
      $('#my-datatable_filter').find('[type="search"]').val('');
      $('#my-datatable').DataTable().search('').draw();
    }

    fetchEmployees(payload?:any) {
       this.employeeListFilter = payload

        return new Promise((resolve, reject) => {
            if (this.employeeListFilter) {
                let payload: any = {
                    'pageno': this.paginationOptions.page,
                    'perpage': this.tableFilterOptions.length,
                    'attendance_month': this.employeeListFilter?.month?.index ?? "",
                    'attendance_year': this.employeeListFilter?.year?.value ?? "",
                    'hod_id': this.employeeListFilter?.hod_id ?? null,
                    'department_id': this.employeeListFilter?.department_id ?? null,
                    'designation_id': this.employeeListFilter?.designation_id ?? null,
                    'branch_id': this.employeeListFilter?.branch_id ?? null,
                };

                // if (this.employeeListFilter?.hod_id) {
                    // if (Array.isArray(this.employeeListFilter.hod_id)) {
                        // payload.hod_id = [];
                        // payload.hod_id = this.employeeListFilter.hod_id
                        // this.employeeListFilter.hod_id.forEach((element: any) => {
                        //     payload.hod_id.push(element.id)
                        // });

                        // if (this.employeeListFilter.hod_id.length) {
                        // } else {
                        //     payload.hod_id = null;
                        // }
                    // }
                    // else {
                    //     payload.hod_id = this.filterForm.value.hod.id;
                    // }
                // }else{
                //     payload.hod_id = null;
                // }

                // if (this.employeeListFilter?.department_id) {
                    // if (Array.isArray(this.employeeListFilter?.department_id)) {
                        // payload.department_id = this.employeeListFilter.department_id;
                        // this.filterForm.value.department.forEach((element: any) => {
                        //     payload.department_id.push(element.id)
                        // });

                        // if (payload.department_id.length > 0) {
                        //     payload.department_id = JSON.stringify(payload.department_id)
                        // } else {
                        //     payload.department_id = null;
                        // }
                    // }
                    // } else {
                    //     payload.department_id = this.filterForm.value.department.id;
                    // }
                // }else{
                //     payload.department_id = null
                // }

                // if (this.employeeListFilter?.designation_id) {
                    // if (Array.isArray(this.employeeListFilter.designation_id)) {
                        // payload.designation_id = this.employeeListFilter.designation_id;
                        // this.filterForm.value.designation.forEach((element: any) => {
                        //     payload.designation_id.push(element.id)
                        // });

                        // if (payload.designation_id.length > 0) {
                        //     payload.designation_id = JSON.stringify(payload.designation_id)
                        // } else {
                        //     payload.designation_id = null;
                        // }
                    // } else {
                    //     payload.designation_id = this.filterForm.value.designation.id;
                    // }
                // }else{
                //     payload.designation_id = null

                // }

                // if (this.employeeListFilter?.branch_id) {
                //         payload.branch_id = this.employeeListFilter?.branch_id;
                    // if (Array.isArray(this.filterForm.value.branch)) {
                    //     this.filterForm.value.branch.forEach((element: any) => {
                    //         payload.branch_id.push(element.id)
                    //     });

                    //     if (payload.branch_id.length > 0) {
                    //         payload.branch_id = JSON.stringify(payload.branch_id)
                    //     } else {
                    //         payload.branch_id = this.filterForm.value.designation.id;
                    //     }
                    // } else {
                    //     payload.branch_id = this.filterForm.value.branch.id;
                    // }
                // }else{
                //     payload.branch_id = null

                // }

                this.spinner.show();
                this.companyuserService.getEarningSheetEmployeeList(payload).subscribe(res => {
                    if (res.status == 'success') {
                        var docs: any[] = res?.employees?.docs ?? [];

                        docs.forEach((doc: any) => {
                            doc.checked = this.isRowChecked(doc._id);
                        });

                        this.employees = docs;
                        this.paginationOptions = {
                            hasNextPage: res.employees.hasNextPage,
                            hasPrevPage: res.employees.hasPrevPage,
                            limit: res.employees.limit,
                            nextPage: res.employees.nextPage,
                            page: res.employees.page,
                            pagingCounter: res.employees.pagingCounter,
                            prevPage: res.employees.prevPage,
                            totalDocs: res.employees.totalDocs,
                            totalPages: res.employees.totalPages,
                        };
                    } else if (res.status == 'val_err') {
                        this.toastr.error(Global.showValidationMessage(res.val_msg));
                        this.employees = [];
                        this.paginationOptions = Global.resetPaginationOption();

                        this.rowCheckedAll = false;
                        this.checkedRowIds = [];
                        this.uncheckedRowIds = [];
                    } else {
                        this.toastr.error(res.message);
                        this.employees = [];
                        this.paginationOptions = Global.resetPaginationOption();

                        this.rowCheckedAll = false;
                        this.checkedRowIds = [];
                        this.uncheckedRowIds = [];
                    }

                    this.spinner.hide();
                    Global.loadCustomScripts('customJsScript');
                    resolve(true);
                }, (err) => {
                    this.rowCheckedAll = false;
                    this.checkedRowIds = [];
                    this.uncheckedRowIds = [];

                    this.toastr.error(Global.showServerErrorMessage(err));
                    this.spinner.hide();
                    this.employees = [];
                    this.paginationOptions = Global.resetPaginationOption();
                    Global.loadCustomScripts('customJsScript');
                    resolve(true);
                });
            }
        })
    }

    /**
     * =========================
     * GENERATE REPORT FUNCTIONS
     * =========================
     * =========================
     */

    async generateReport() {
        if (this.rowCheckedAll == false && (this.checkedRowIds.length == 0 && this.uncheckedRowIds.length == 0)) {
            // this.toastr.error("Please select atleast one employee to continue");
            return;
        }

        let template_id: any = null;
        // if (!this.generateReportForm.get('template')?.valid) {
        //   this.toastr.error("Please select atleast one template");
        //   return;
        // } else {
        //   const temp = this.generateReportForm.get('template')?.value;
        //   if (temp?._id != 'master-template') {
        //     await this.generateTemplate(temp)
        //     template_id = temp._id ?? ""
        //   }
        // }

        return new Promise((resolve, reject) => {
            this.spinner.show();
            this.empReportData = [];

            let document = this.getReportPayload();
            document.template_id = template_id ?? ""; // Pass the template id here
            this.companyuserService.generateEmployeeEarningSheet(document).subscribe(res => {
                if (res.status == 'success') {
                    const emp_sal_breakup = res?.emp_sal_breakup ?? [];
                    if (emp_sal_breakup?.length == 0) {
                        this.toastr.warning("No data found to generate report");
                        return;
                    }

                    this.empReportData = emp_sal_breakup;
                    this.empReportGenerated = true;
                    this.restoreReportTempData()
                    Global.loadCustomScripts('customJsScript');
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }

                this.spinner.hide();
                resolve(true);
            }, (err) => {
                this.toastr.error(Global.showServerErrorMessage(err));
                this.spinner.hide();
                resolve(true);
            });
        })
    }

    getReportPayload() {
        let payload: any = {
            'row_checked_all': this.rowCheckedAll,
            'checked_row_ids': JSON.stringify(this.checkedRowIds),
            'unchecked_row_ids': JSON.stringify(this.uncheckedRowIds),
            'attendance_month': this.filterForm.value.month?.index ?? "",
            'attendance_year': this.filterForm.value.year?.value ?? "",
        }

        return payload;
    }

    private isRowChecked(rowId: any) {
        if (!this.rowCheckedAll) {
            return this.checkedRowIds.indexOf(rowId) >= 0 ? true : false;
        }
        else {
            return this.uncheckedRowIds.indexOf(rowId) >= 0 ? false : true;
        }
    }

    rowCheckBoxChecked(event: any, row: any) {
        let rowId: any = row._id;
        let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

        if (checkbox.length > 0) {
            if (checkbox[0].checked) {
                this.uncheckedRowIds.splice(this.uncheckedRowIds.indexOf(rowId), 1);
                if (!this.rowCheckedAll) {
                    if (!this.checkedRowIds.includes(rowId)) {
                        this.checkedRowIds.push(rowId);
                    }
                }
            }
            else {
                this.checkedRowIds.splice(this.checkedRowIds.indexOf(rowId), 1);
                if (this.rowCheckedAll) {
                    if (!this.uncheckedRowIds.includes(rowId)) {
                        this.uncheckedRowIds.push(rowId);
                    }
                }
            }
        }
    }

    allRowsCheckboxChecked(event: any) {
        if (this.rowCheckedAll) {
            this.uncheckedRowIds.length = 0;
            this.rowCheckedAll = false;
        } else {
            this.checkedRowIds.length = 0;
            this.rowCheckedAll = true;
        }

        this.fetchEmployees()
    }

    restoreReportTempData() {
        let master_head_includes: any[] = []
        let head_includes: any[] = []
        let extra_earning_data: any[] = []

        if (this.empReportData.length > 0) {
            // Generating Report Available Heads
            this.empReportData.forEach(reportData => {
                (reportData.heads_rate ?? []).forEach((head: any) => {
                    let exist = master_head_includes.find((obj: any) => {
                        return obj.head_id == head.head_id
                    }) ?? null;

                    if (!exist) {
                        master_head_includes.push({
                            amount: head.amount,
                            head_id: head.head_id,
                            head_rate: head.head_rate,
                            head_rate_type: head.head_rate_type,
                            head_title: head.head_title,
                            head_abbreviation: head.head_abbreviation,
                        });
                    }
                });
            });

            // Generating Report Available Heads
            this.empReportData.forEach(reportData => {
                (reportData.heads ?? []).forEach((head: any) => {
                    let exist = head_includes.find((obj: any) => {
                        return obj.head_id == head.head_id
                    }) ?? null;

                    if (!exist) {
                        head_includes.push({
                            head_id: head.head_id,
                            head_rate: head.head_rate,
                            head_rate_type: head.head_rate_type,
                            head_title: head.head_title,
                            head_abbreviation: head.head_abbreviation,
                        });
                    }
                });
            });

            // Generate Extra Earning Heads
            this.empReportData.forEach(reportData => {
                (reportData.extra_earning_data ?? []).forEach((extraEarning: any) => {
                    let exist = extra_earning_data.find((obj: any) => {
                        return obj.earning_abbreviation == extraEarning.earning_abbreviation
                    }) ?? null;

                    if (!exist) {
                        extra_earning_data.push({
                            earning_title: extraEarning.earning_title,
                            earning_abbreviation: extraEarning.earning_abbreviation,
                        });
                    }
                });
            });
        }

        // console.log('master_head_includes : ', master_head_includes)
        // console.log('head_includes : ', head_includes)
        // console.log('extra_earning_data : ', extra_earning_data)

        this.empReportTempData = {
            master_head_includes: master_head_includes,
            head_includes: head_includes,
            extra_earning_data: extra_earning_data
        }

        // console.log('empReportTempData : ', this.empReportTempData);
    }

    resetSalarySheet() {
        this.empReportGenerated = false;
        this.empReportData = [];

        this.cancelSheetTemplateSelection();

        this.rowCheckedAll = false;
        this.checkedRowIds = [];
        this.uncheckedRowIds = [];
        this.fetchEmployees();
    }

    generateReportPdf() {
        let pdf = new jsPDF('l', 'pt', 'a1', true)
        pdf.html(this.el.nativeElement, {
            callback: (pdf) => {
                pdf.save("salarysheetreporttable.pdf")
            }
        })
    }

    getIndexValue(obj: any, key: string) {
        return obj[key];
    }

    getSheetTemplateMasterHeadColspan(main_slug: any) {
        let cntr: number = 0;

        let _sTemplate: any[] = this._tempSheetTemplate

        let _mainModule: any = _sTemplate.find((obj: any) => {
            return obj.main_slug == main_slug
        })

        _mainModule.modules.forEach((element: any) => {
            cntr += this.getSheetTemplateHeadColspan(main_slug, element.module_slug, true)
        });

        return cntr
    }

    getSheetTemplateHeadColspan(main_slug: any, module_slug: any, isFromMaster = false) {
        let _sTemplate: any[] = this._tempSheetTemplate

        let _mainModule: any = _sTemplate.find((obj: any) => {
            return obj.main_slug == main_slug
        })

        const module = _mainModule.modules.find((obj: any) => {
            return obj.module_slug == module_slug;
        })

        if (module) {
            let length = (module.fields ?? []).length;

            /** CHECK IF MASTER DYNAMIC HEAD IS PRESENT */
            const dynamicMasterHeadFieldLength = (module.fields ?? []).filter((obj: any) => {
                return obj.slug == 'master-dynamic-heads'
            }).length;

            if (dynamicMasterHeadFieldLength > 0) {
                length += (((this.empReportTempData.master_head_includes ?? []).length * dynamicMasterHeadFieldLength) - dynamicMasterHeadFieldLength);
            } else if (dynamicMasterHeadFieldLength == 0 && isFromMaster == true) {
                // length += 1;
            }

            /** CHECK IF DYNAMIC HEAD IS PRESENT */
            const dynamicHeadFieldLength = (module.fields ?? []).filter((obj: any) => {
                return obj.slug == 'dynamic-heads'
            }).length;

            if (dynamicHeadFieldLength > 0) {
                length += (((this.empReportTempData.head_includes ?? []).length * dynamicHeadFieldLength) - dynamicHeadFieldLength);
            } else if (dynamicHeadFieldLength == 0 && isFromMaster == true) {
                // length += 1;
            }

            /** CHECK IF EXTRAEARNING HEAD IS PRESENT */
            const extraEarningFieldLength = (module.fields ?? []).filter((obj: any) => {
                return obj.slug == 'extra-earnings'
            }).length;

            if (extraEarningFieldLength > 0) {
                length += (((this.empReportTempData.extra_earning_data ?? []).length * extraEarningFieldLength) - extraEarningFieldLength);
            } else if (extraEarningFieldLength == 0 && isFromMaster == true) {
                // length += 1;
            }

            return length;
        } else {
            return 0;
        }
    }

    getSheetTemplateReportValue(main_slug: any, module_slug: any, field_slug: any, report: any) {
        let _sTemplate: any[] = this._tempSheetTemplate

        let _mainModule: any = _sTemplate.find((obj: any) => {
            return obj.main_slug == main_slug
        })

        const module = _mainModule.modules.find((obj: any) => {
            return obj.module_slug == module_slug;
        })

        if (module) {
            const field = (module.fields ?? []).find((obj: any) => {
                return obj.slug == field_slug;
            })

            if (field) {
                if (field_slug == 'month_days' && module_slug == 'attendance') {
                    let monthIndex = report?.emp_data?.attendance_summaries?.attendance_month;
                    let year = report?.emp_data?.attendance_summaries?.attendance_year

                    let month = this.monthMaster.find((obj: any) => {
                        return obj.index == monthIndex;
                    })

                    if (month) {
                        let days = month.days;

                        if (year % 4 == 0 && month.index == 1) { // For Feb & Leap Year
                            days++;
                        }

                        return days
                    }
                }

                let mapping = field.mapping.split('.')

                if (mapping.length > 0) {
                    let value = report;
                    mapping.forEach((key: any) => {
                        if (value !== null && value !== undefined) {
                            value = value[key] ?? null;
                        }
                    });

                    return value ?? null
                } else {
                    return null
                }
            } else {
                return null;
            }
        } else {
            return null
        }
    }

    /**
     * =========================
     * DYNAMIC BREAKUP Functions
     * =========================
     */

    getHeadValue(heads: any[], head_id: any, key: any) {
        let head = heads.find((obj: any) => {
            return obj.head_id == head_id
        }) ?? null;

        if (head) {
            return head[key] ?? 0;
        } else {
            return 0
        }
    }

    /**
     * =========================
     * EXTRA EARNING Functions
     * =========================
     */

    getExtraEarningValue(extraEarnings: any[], earning_abbreviation: any, key: any) {
        let earning = extraEarnings.find((obj: any) => {
            return obj.earning_abbreviation == earning_abbreviation
        }) ?? null;

        if (earning) {
            return earning[key] ?? 0;
        } else {
            return 0
        }

    }

    /**
     * =========================
     * Template Create Functions
     * =========================
     */

    initTemplateCreate() {
        this.cancelTemplateCreate();
        $('#settingsTemplateModalOpen')?.click();
    }

    cancelTemplateCreate() {
        $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
        Global.resetForm(this.templateForm);
        this.resetSelectedModules();
    }

    async submitTemplate(event: any) {
        this.templateForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('p.text-danger')
        }, 300);

        let modules: any = await this.getSelecteModules();
        if (Object.keys(modules).length < 1) {
            this.toastr.error("Please select atleast one field");
            return;
        }

        if (this.templateForm.valid && Object.keys(modules).length > 0) {
            let document = {
                'template_name': this.templateForm.value.template_name,
                'template_fields': JSON.stringify(modules),
            }

            event.target.classList.add('btn-loading');
            this.companyuserService.createEmployeeSheetTemplate(document).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelTemplateCreate();
                    this.fetchSettingsTemplate();
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }
                event.target.classList.remove('btn-loading');
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }

    getSelecteModules() {
        return new Promise((resolve, reject) => {
            const masterModules: any[] = [];
            this.sheetTemplate.forEach((master: any) => {
                const modules: any[] = []
                master.modules.forEach((row: any) => {
                    const access: any = [];

                    $('input[name="fields[' + row.module_slug + ']"]:checked').each(function () {
                        access.push($(this).val())
                    });

                    if (access.length > 0) {
                        modules.push({
                            'module_slug': row.module_slug,
                            'fields': access
                        });
                    }
                });

                if (modules.length > 0) {
                    masterModules.push({
                        'main_slug': master.main_slug,
                        'modules': modules
                    });
                }
            });

            // console.log('masterModules : ', masterModules);
            resolve(masterModules);
        })
    }

    resetSelectedModules() {
        this.sheetTemplate.forEach(row => {
            $('input[name="fields[' + row.module_slug + ']"]:checked').each(function () {
                $(this).prop('checked', false)
            });
        });
    }

    /**
     * ============================
     * TEMPLATE SELECTION FUNCTIONS
     * ============================
     */

    fetchSettingsTemplate() {
        return new Promise((resolve, reject) => {
            this.sheetTemplateMaster = [];

            this.spinner.show();
            this.companyuserService.fetchEmployeeSheetTemplates({
                'pageno': 1,
                temp_module_for:"salary_sheet"
            }).subscribe(res => {
                this.spinner.hide();
                if (res.status == 'success') {
                    this.sheetTemplateMaster = res?.earning_sheet_temp?.docs ?? [];
                    resolve(true);
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                    reject(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                    reject(res.message);
                }
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                reject(Global.showServerErrorMessage(err));
            });
        })
    }

    async initSheetTemplateSelection() {
        await this.fetchSettingsTemplate();
        Global.resetForm(this.templateSelectionForm);
        $('#template-selection-form')?.show(500);
    }


    cancelSheetTemplateSelection() {
        $('#template-selection-form')?.hide(500);
        this._tempSheetTemplate = this.sheetTemplate;
    }

    generateTemplate_v2() {
        if (this.templateSelectionForm.valid) {
            const template = this.templateSelectionForm.value.template;
            const templateFields = template?.template_fields ?? [];

            if (templateFields.length < 1) {
                this.toastr.error("No module available for this template");
                return;
            }

            let tempTemplateMaster: any[] = []
            templateFields.forEach((templateField: any) => {
                let tempModule = this.sheetTemplate.find((obj: any) => {
                    return obj.module_slug == templateField.module_slug;
                })

                if (tempModule) {
                    let fields: any[] = [];
                    (templateField.fields ?? []).forEach((field: any) => {
                        let f = tempModule.fields.find((obj: any) => {
                            return obj.slug == field;
                        })

                        if (f) {
                            fields.push(f);
                        }
                    });

                    if (fields.length > 0) {
                        tempTemplateMaster.push({
                            'module_title': tempModule.module_title,
                            'module_slug': tempModule.module_slug,
                            'fields': fields
                        })
                    }
                }
            });

            if (tempTemplateMaster.length == 0) {
                this.toastr.error("The template cannot be generated, as no module cannot be pointed");
                return;
            }

            this._tempSheetTemplate = tempTemplateMaster;
        }
    }

    generateTemplate_v3(template: any) {
        return new Promise((resolve, reject) => {
            if (template) {
                // const template = this.templateSelectionForm.value.template;
                const templateFields = template?.template_fields ?? [];

                if (templateFields.length < 1) {
                    this.toastr.error("No module available for this template");
                    return;
                }

                let tempTemplateMaster: any[] = []
                templateFields.forEach((templateField: any) => {
                    let tempModule = this.sheetTemplate.find((obj: any) => {
                        return obj.module_slug == templateField.module_slug;
                    })

                    if (tempModule) {
                        let fields: any[] = [];
                        (templateField.fields ?? []).forEach((field: any) => {
                            let f = tempModule.fields.find((obj: any) => {
                                return obj.slug == field;
                            })

                            if (f) {
                                fields.push(f);
                            }
                        });

                        if (fields.length > 0) {
                            tempTemplateMaster.push({
                                'module_title': tempModule.module_title,
                                'module_slug': tempModule.module_slug,
                                'fields': fields
                            })
                        }
                    }
                });

                if (tempTemplateMaster.length == 0) {
                    this.toastr.error("The template cannot be generated, as no module cannot be pointed");
                    reject("The template cannot be generated, as no module cannot be pointed");
                }

                this._tempSheetTemplate = tempTemplateMaster;
                resolve(true)
            } else {
                this.toastr.error("No Template Found Exception");
                reject("No Template Found Exception");
            }
        })

    }

    generateTemplate(template: any) {
        return new Promise((resolve, reject) => {
            if (template) {
                const selectedTemplateFields = template?.template_fields ?? [];
                if (selectedTemplateFields.length < 1) {
                    this.toastr.error("No module available for this template");
                    return;
                }

                let tempTemplateMaster: any[] = []
                selectedTemplateFields.forEach((selectedTemplateField: any) => {
                    let tempMainModule = this.sheetTemplate.find((obj: any) => {
                        return obj.main_slug == selectedTemplateField.main_slug;
                    })

                    if (tempMainModule) {
                        let modules: any[] = [];
                        (selectedTemplateField.modules ?? []).forEach((selectedModule: any) => {
                            let tempModule = tempMainModule.modules.find((obj: any) => {
                                return obj.module_slug == selectedModule.module_slug
                            })

                            let fields: any[] = [];
                            (selectedModule.fields ?? []).forEach((field: any) => {
                                let f = tempModule.fields.find((obj: any) => {
                                    return obj.slug == field;
                                })

                                if (f) {
                                    fields.push(f);
                                }
                            });

                            if (fields.length > 0) {
                                modules.push({
                                    'module_title': tempModule.module_title,
                                    'module_slug': tempModule.module_slug,
                                    'fields': fields,
                                })
                            }
                        });

                        tempTemplateMaster.push({
                            'main_title': tempMainModule.main_title,
                            'main_slug': tempMainModule.main_slug,
                            'modules': modules
                        })
                    }
                });

                if (tempTemplateMaster.length == 0) {
                    this.toastr.error("The template cannot be generated, as no module cannot be pointed");
                    reject("The template cannot be generated, as no module cannot be pointed");
                }

                this._tempSheetTemplate = tempTemplateMaster;
                resolve(true)
            } else {
                this.toastr.error("No Template Found Exception");
                reject("No Template Found Exception");
            }
        })

    }

    /**
     * =====================
     * HOLD SALARY FUNCTIONS
     * =====================
     */

    initHoldSalary(emp: any) {
        this.cancelHoldSalaryEntry()
        this.empSalaryHoldForm.get('emp_details')?.patchValue(emp)

        if (emp?.hold_salary_emps) {
            this.empSalaryHoldForm.get('hold_type')?.patchValue(
                this.holdTypeMaster.find((obj: any) => {
                    return obj.value == emp?.hold_salary_emps?.hold_type
                })
            )
        }

        $('#salaryHoldModalOpen')?.click();
    }

    cancelHoldSalaryEntry() {
        Global.resetForm(this.empSalaryHoldForm);
        $('#salaryHoldModal')?.find('[data-dismiss="modal"]')?.click();
    }

    submitEmpSalaryHold(event: any) {
        this.empSalaryHoldForm.markAllAsTouched();
        setTimeout(() => {
            Global.scrollToQuery('p.text-danger')
        }, 300);

        if (this.empSalaryHoldForm.valid) {
            let payload = {
                'hold_type': this.empSalaryHoldForm.value.hold_type?.value ?? "",
                'emp_id': this.empSalaryHoldForm.value?.emp_details?.emp_id ?? "",
                'emp_db_id': this.empSalaryHoldForm.value?.emp_details?._id ?? "",
                'wage_month': this.filterForm.value.month?.index ?? "",
                'wage_year': this.filterForm.value.year?.value ?? "",
            }

            event.target.classList.add('btn-loading');
            this.companyuserService.employeeSalaryHold(payload).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelHoldSalaryEntry();
                    this.fetchEmployees();
                } else if (res.status == 'val_err') {
                    this.toastr.error(Global.showValidationMessage(res.val_msg));
                } else {
                    this.toastr.error(res.message);
                }
                event.target.classList.remove('btn-loading');
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }

    revokeHoldSalary(item: any) {
        let hold_sal_id: any[] = []
        if (item == 'multiple') {
            hold_sal_id = this.salaryHold_checkedRowIds;
        } else {
            hold_sal_id.push(item._id);
        }

        // console.log('hold_sal_id : ', hold_sal_id)

        if (hold_sal_id.length > 0) {
            swal.fire({
                title: 'Are you sure want to revoke the salary hold?',
                // text: 'You will not be able to recover this data!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, proceed!',
                cancelButtonText: 'No, cancel'
            }).then((result) => {
                if (result.value) {
                    this.spinner.show();
                    this.companyuserService.removeEmployeeSalaryHold({
                        'hold_sal_emp_list': JSON.stringify(hold_sal_id),
                    }).subscribe(res => {
                        if (res.status == 'success') {
                            this.toastr.success(res.message);
                            this.cancelHoldSalaryEntry();
                            this.getHoldSalaries();
                            this.fetchEmployees();
                        } else {
                            this.toastr.error(res.message);
                            this.spinner.hide();
                        }
                    }, (err) => {
                        this.toastr.error(Global.showServerErrorMessage(err));
                        this.spinner.hide();
                    });
                }
            })
        }
    }

    getHoldSalaries({
        openmodal = <boolean>false,
        page = <any>null,
    } = {}) {
        if (page != null) {
            this.holdedSalarypaginationOptions.page = page;
        }

        this.salaryHold_rowCheckedAll = false
        this.salaryHold_checkedRowIds = []

        if (this.filterForm.valid) {
            let payload = {
                'wage_month': this.filterForm.value.month?.index ?? "",
                'wage_year': this.filterForm.value.year?.value ?? "",
                'pageno': this.holdedSalarypaginationOptions.page,
            }

            this.spinner.show();
            this.companyuserService.fetchEmployeeSalaryHold(payload)
                .subscribe(res => {
                    if (res.status == 'success') {
                        this.holdedEmpSalaries = res?.employees?.docs ?? [];
                        this.holdedSalarypaginationOptions = {
                            hasNextPage: res.employees.hasNextPage,
                            hasPrevPage: res.employees.hasPrevPage,
                            limit: res.employees.limit,
                            nextPage: res.employees.nextPage,
                            page: res.employees.page,
                            pagingCounter: res.employees.pagingCounter,
                            prevPage: res.employees.prevPage,
                            totalDocs: res.employees.totalDocs,
                            totalPages: res.employees.totalPages,
                        }

                        if (openmodal) $('#salaryHoldModalEmpOpen')?.click();

                        setTimeout(() => {
                            Global.loadCustomScripts('customJsScript');
                        });
                    } else {
                        this.toastr.error(res.message);
                        this.holdedEmpSalaries = [];
                        this.holdedSalarypaginationOptions = Global.resetPaginationOption();
                    }

                    this.spinner.hide();
                }, (err) => {
                    this.spinner.hide();
                    this.toastr.error(Global.showServerErrorMessage(err));
                    this.holdedEmpSalaries = [];
                    this.holdedSalarypaginationOptions = Global.resetPaginationOption();
                });
        }
    }

    salaryHold_rowCheckedAll: Boolean = false;
    salaryHold_checkedRowIds: any[] = [];
    salaryHold_uncheckedRowIds: any[] = [];

    salaryHold_allRowsCheckboxChecked(event: any) {
        if (this.salaryHold_rowCheckedAll) {
            this.salaryHold_rowCheckedAll = false;
            this.salaryHold_checkedRowIds = [];
        } else {
            this.salaryHold_rowCheckedAll = true;
            this.salaryHold_checkedRowIds = [];
            this.holdedEmpSalaries.forEach(element => {
                this.salaryHold_checkedRowIds.push(element._id);
            });
        }

        this.holdedEmpSalaries.forEach(element => {
            element.checked = this.salaryHold_isRowChecked(element._id);
        });
    }

    private salaryHold_isRowChecked(rowId: any) {
        if (this.salaryHold_checkedRowIds.includes(rowId)) {
            return true;
        } else {
            return false;
        }
    }

    salaryHold_rowCheckBoxChecked(event: any, row: any) {
        let rowId: any = row._id;
        let checkbox: any = document.querySelectorAll('[data-checkbox-id="' + rowId + '"]');

        if (checkbox.length > 0) {
            if (checkbox[0].checked) {
                if (!this.salaryHold_checkedRowIds.includes(rowId)) {
                    this.salaryHold_checkedRowIds.push(rowId);
                }
            } else {
                if (this.salaryHold_checkedRowIds.includes(rowId)) {
                    this.salaryHold_checkedRowIds.splice(this.salaryHold_checkedRowIds.indexOf(rowId), 1);
                }
            }
        }
    }
}
