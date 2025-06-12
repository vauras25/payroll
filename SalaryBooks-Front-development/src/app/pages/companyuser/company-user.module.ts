import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { DataTablesModule } from 'angular-datatables';
import { NgChartsModule } from 'ng2-charts';
import { DpDatePickerModule } from 'ng2-date-picker';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { NgxSpinnerModule } from 'ngx-spinner';
import { IncludesModule } from '../includes/includes.module';
import { CompanyUserRoutes } from './company-user.routing';
import { CMPAdvanceManagementComponent } from './advancemanagement/advance/advance.component';
import { CMPAttendanceConfigurationComponent } from './attendance/configuration/configuration.component';
import { CMPAttendanceDailyDetailsComponent } from './attendance/daily-details/daily-details.component';
import { CMPAttendanceEditComponent } from './attendance/edit/edit.component';
import { CMPAttendanceRegisterTypeComponent } from './attendance/register-type/register-type.component';
import { CMPAttendanceWeeklyHolidayComponent } from './attendance/weekly-holiday/weekly-holiday.component';
import { CMPAttendanceYearlyHolidayComponent } from './attendance/yearly-holiday/yearly-holiday.component';
import { CMPBonusAppliedRefactorComponent } from './bonusmanagement/bonus-applied copy/bonus-applied-refactor.component';
import { CMPBonusAppliedComponent } from './bonusmanagement/bonus-applied/bonus-applied.component';
import { BonusReportComponent } from './bonusmanagement/bonus-report/bonus-report.component';
import { CMPArrearslipTemplateComponent } from './companyrules/arrearslip-template/arrearslip-template.component';
import { CMPAttendancePolicyComponent } from './companyrules/attendance-policy/attendance-policy.component';
import { CMPBonusPolicyComponent } from './companyrules/bonus-policy/bonus-policy.component';
import { CMPBonusslipTemplateComponent } from './companyrules/bonusslip-template/bonusslip-template.component';
import { CMPIncentivePolicyComponent } from './companyrules/incentive-policy/incentive-policy.component';
import { CMPLeaveHeadsComponent } from './companyrules/leavepolicy/leave-heads/leave-heads.component';
import { CMPLeaveRuleComponent } from './companyrules/leavepolicy/leave-rule/leave-rule.component';
import { CMPLeaveTemplateComponent } from './companyrules/leavepolicy/leave-template/leave-template.component';
import { CMPLwfRuleComponent } from './companyrules/lwf-rule/lwf-rule.component';
import { CMPOvertimePolicyComponent } from './companyrules/overtime-policy/overtime-policy.component';
import { CMPPayslipTemplateComponent } from './companyrules/payslip-template/payslip-template.component';
import { CMPPtaxRuleComponent } from './companyrules/ptax-rule/ptax-rule.component';
import { CMPTdsRuleComponent } from './companyrules/tds-rule/tds-rule.component';
import { CMPEmployeeListComponent } from './employees/employee-list/employee-list.component';
import { CMPEmployeePackageDetailsComponent } from './employees/employee-package-details/employee-package-details.component';
import { CMPEmployeePrintComponent } from './employees/employee-print/employee-print.component';
import { CMPEmployeeSalarytempDetailsComponent } from './employees/employee-salarytemp-details/employee-salarytemp-details.component';
import { CMPExtraDeductionComponent } from './employees/extra-deduction/extra-deduction.component';
import { CMPExtraDeductionHeadMasterComponent } from './employees/extra-deduction/head-master/extra-deduction-headmaster.component';
import { CMPEmployeeAccidentdetailsFormComponent } from './employees/form/employee-accidentdetails/employee-accidentdetails.component';
import { CMPEmployeeAddressFormComponent } from './employees/form/employee-address/employee-address.component';
import { CMPEmployeeAnnualcomponentFormComponent } from './employees/form/employee-annualcomponent/employee-annualcomponent.component';
import { CMPEmployeeAssetsFormComponent } from './employees/form/employee-assets/employee-assets.component';
import { CMPEmployeeBankFormComponent } from './employees/form/employee-bank/employee-bank.component';
import { CMPEmployeeContractFormComponent } from './employees/form/employee-contract/employee-contract.component';
import { CMPEmployeeDetailsFormComponent } from './employees/form/employee-details/employee-details.component';
import { CMPEmployeeDisciplinaryFormComponent } from './employees/form/employee-disciplinary/employee-disciplinary.component';
import { CMPEmployeeEducationFormComponent } from './employees/form/employee-education/employee-education.component';
import { CMPEmployeeEmploymentFormComponent } from './employees/form/employee-employment/employee-employment.component';
import { CMPEmployeeExtracurriculumFormComponent } from './employees/form/employee-extracurriculum/employee-extracurriculum.component';
import { CMPEmployeeFamilyFormComponent } from './employees/form/employee-family/employee-family.component';
import { CMPEmployeeFullfinalFormComponent } from './employees/form/employee-fullfinal/employee-fullfinal.component';
import { CMPEmployeeHrdetailsFormComponent } from './employees/form/employee-hrdetails/employee-hrdetails.component';
import { CMPEmployeeOtherdetailsFormComponent } from './employees/form/employee-otherdetails/employee-otherdetails.component';
import { CMPEmployeeTrainingattendantFormComponent } from './employees/form/employee-trainingattendant/employee-trainingattendant.component';
import { CMPEmployeeFormNavbarComponent } from './employees/form/navbar/navbar.component';
import { CMPUnauthorizedAccessErrorComponent } from './errors/unauthorized-access/unauthorized-access.component';
import { CMPBonusRulesComponent } from './govtrules/bonus-rules/bonus-rules.component';
import { CMPEpfoRulesComponent } from './govtrules/epfo-rules/epfo-rules.component';
import { CMPEsicRulesComponent } from './govtrules/esic-rules/esic-rules.component';
import { CMPGratuityRulesComponent } from './govtrules/gratuity-rules/gratuity-rules.component';
import { CMPHomeComponent } from './home/home.component';
import { CMPIncentiveListRefactorComponent } from './incentivemanagment/incentive-list copy/incentive-list-refactor.component';
import { CMPIncentiveListComponent } from './incentivemanagment/incentive-list/incentive-list.component';
import { CompanyuserDashboardFooterComponent } from './includes/dashboard-footer/dashboard-footer.component';
import { CompanyuserDashboardHeaderComponent } from './includes/dashboard-header/dashboard-header.component';
import { CompanyuserDashboardSidebarComponent } from './includes/dashboard-sidebar/dashboard-sidebar.component';
import { CompanyuserDashboardTopbarComponent } from './includes/dashboard-topbar/dashboard-topbar.component';
import { CompanyuserTableFilterComponent } from './includes/table-filter/table-filter.component';
import { CMPBankPaymentComponent } from './master/bank-payment/bank-payment.component';
import { CMPClientComponent } from './master/client/client.component';
import { CMPDepartmentComponent } from './master/department/department.component';
import { CMPDesignationComponent } from './master/designation/designation.component';
import { CMPDispensaryComponent } from './master/dispensary/dispensary.component';
import { CMPLetterWritingComponent } from './master/letter-writing/letter-writing.component';
import { CMPEmployeePackagesComponent } from './packages/employee-packages/employee-packages.component';
import { CMPProfileComponent } from './profile/profile.component';
import { CMPArrearReportComponent } from './report/arrear-report/arrear-report.component';
import { CMPChallanReportDataConfirmComponent } from './report/challan-report-data-confirm/challan-report-data-confirm.component';
import { CMPChallanReportDataComponent } from './report/challan-report-data/challan-report-data.component';
import { CMPChallanReportComponent } from './report/challan-report/challan-report.component';
import { CMPInstructionReportDataComponent } from './report/instruction-report-data/instruction-report-data.component';
import { CMPInstructionReportComponent } from './report/instruction-report/instruction-report.component';
import { CMPMasterSheetReportRefactorComponent } from './report/master-sheet refactor/master-sheet-refactor.component';
import { CMPMasterSheetReportNewComponent } from './report/master-sheet-new/master-sheet-new.component';
import { CMPMasterSheetReportComponent } from './report/master-sheet/master-sheet.component';
import { CMPPayslipNewComponent } from './report/payslip-new/payslip-new.component';
import { CMPSalaryHoldsReportComponent } from './report/salary-holds/salary-holds.component';
import { CMPSalarySheetReportNewComponent } from './report/salary-sheet-new/salary-sheet-new.component';
import { CMPSalarySheetReportComponent } from './report/salary-sheet/salary-sheet.component';
import { CMPEditRevisionComponent } from './revisionmanagement/edit-revision/edit-revision.component';
import { CMPRunRevisionComponent } from './revisionmanagement/run-revision/run-revision.component';
import { CMPRolesComponent } from './roles/roles.component';
import { CMPSalaryCalculatorComponent } from './salary-calculator/salary-calculator.component';
import { CMPSalaryTemplateDetailsModalComponent } from './salary-template/salary-template-details-modal/salary-template-details-modal.component';
import { CMPSalaryTemplateComponent } from './salary-template/salary-template.component';
import { CMPSettingsComponent } from './settings/settings.component';
import { CMPShiftAddComponent } from './shifts/shift-add/shift-add.component';
import { CMPShiftBatchComponent } from './shifts/shift-batch/shift-batch.component';
import { CMPShiftRateComponent } from './shifts/shift-rate/shift-rate.component';
import { CMPShiftsSetupComponent } from './shifts/shifts-setup/shifts-setup.component';
import { CMPStaffsComponent } from './staffs/staffs.component';
import { CMListingConsoleComponent } from './compliance/compliance-listing-console/compliance-listing-console.component';
import { CMPChallanReportDataNewComponent } from './report/challan-report-data new/challan-report-data-new.component';
import { CMPAttendanceListingConsoleComponent } from './attendance/attendance-listing-console/attendance-listing-console.component';
import { CMPIncentiveReportListingComponent } from './incentivemanagment/incentive-report-listing/incentive-report-listing.component';
import { CMPAdvanceListingConsoleComponent } from './advancemanagement/advance-listing-console/advance-listing-console.component';
import { CMPBonusReportListingComponent } from './bonusmanagement/bonus-report-listing/bonus-report-listing.component';
import { CMPBonusSlipComponent } from './bonusmanagement/bonus-slip/bonus-slip.component';
import { CMPBonusRunComponent } from './bonusmanagement/bonus-run/bonus-run.component';
import { CMPOvertimeReportComponent } from './report/overtime-report/overtime-report.component';
import { CMPAttendanceFunnelUploadComponent } from './attendancefunnel/upload/upload.component';
import { NgxNumToWordsModule } from 'ngx-num-to-words';
import { CMPOvertimeRunComponent } from './report/overtime-run/overtime-run.component';
import { CMPPayslipTemplateModalComponent } from './companyrules/payslip-template/payslip-template-modal/payslip-template-modal.component';
import { CMPLayoffListingComponent } from './report/layoff-listing/layoff-listing.component';
import { CMPTdsReportListingComponent } from './report/tds-report-listing/tds-report-listing.component';
import { CMPLeaveReportListingComponent } from './report/leave-report-listing/leave-report-listing.component';
import { CMPShiftReportListingComponent } from './report/shift-report-listing/shift-report-listing.component';
import { CMPApplyApproveTdsComponent } from './tds/apply-approve-tds/apply-approve-tds.component';
import { CMPApplyLayoffComponent } from './layoff/apply-layoff/apply-layoff.component';
import { CMPAdvanceRunComponent } from './advancemanagement/run/run.component';
import { CMPAttendanceFunnelUploadCsvComponent } from './attendancefunnel/upload-csv/upload-csv.component';
import { CMPPayslipPrintComponent } from './report/payslip-new/payslip-print/payslip-print.component';
import { CMPItaxSlabsComponent } from './govtrules/itax-slabs/itax-slabs.component';
import { CMPItaxCategoriesComponent } from './govtrules/itax-categories/itax-categories.component';
import { EmployeeTdsComponent } from './employees/form/employee-tds/employee-tds.component';
import { RevisionReportComponent } from './revisionmanagement/revision-report/revision-report.component';
import { SmtpComponent } from './smtp/smtp.component';
import { TdsTemplateComponent } from './tds-template/tds-template.component';
import { AttendanceReportComponent } from './report/attendance-report/attendance-report.component';
import { FormDComponent } from './report/attendance-report/form-d/form-d.component';
import { LateReportDetailComponent } from './report/attendance-report/late-report-detail/late-report-detail.component';
import { LateReportSummaryComponent } from './report/attendance-report/late-report-summary/late-report-summary.component';
import { MonthWiseSummaryComponent } from './report/attendance-report/month-wise-summary/month-wise-summary.component';
import { SummaryReportComponent } from './report/attendance-report/summary-report/summary-report.component';
import { CMPPrintLayoffListingComponent } from './layoff/print-layoff-listing/print-layoff-listing.component';
import { CMPFormBWageRegisterComponent } from './govtForms&Registers/FormB-wage-register/FormB-wage-register.component';
import { WholeDayComponent } from './report/attendance-report/whole-day/whole-day.component';
import { TimeReportComponent } from './report/attendance-report/time-report/time-report.component';
import { HalfDayComponent } from './report/attendance-report/half-day/half-day.component';
import { LeaveEncashmentComponent } from './report/leave-encashment/leave-encashment.component';
import { LeaveEncashReportLisingComponent } from './report/leave-encash-report-lising/leave-encash-report-lising.component';
import { LeaveLedgerReportComponent } from './report/leave-ledger-report/leave-ledger-report.component';
import { DetailReportComponent } from './report/leave-ledger-report/detail-report/detail-report.component';
import { CMPAttendanceReportPrintComponent } from './attendance/attendance-listing-console/attendance-report-print/attendance-report-print.component';
import { CMPPfBulkTemplateComponent } from './employees/employee-list/pf-bulk-template/pf-bulk-template.component';
import { LeaveComponent } from './approval/leave/leave.component';
import { DetailComponent } from './tds/detail/detail.component';
import { ExtraDeductionComponent } from './approval/extra-deduction/extra-deduction.component';
import { CMPIncentiveViewReportComponent } from './incentivemanagment/incentive-report-listing/incentive-view-report/incentive-view-report.component';
import { CMPCompliancePfReportComponent } from './compliance/compliance-pf-report/compliance-pf-report.component';
import { CMPCompliancePtReportComponent } from './compliance/compliance-pt-report/compliance-pt-report.component';
import { CMPComplianceEsicReportComponent } from './compliance/compliance-esic-report/compliance-esic-report.component';
import { AdvanceComponent } from './approval/advance/advance.component';
import { CMPAuditSummaryReportComponent } from './audit/audit-summary-report/audit-summary-report.component';
import { CMPPfSummaryReportComponent } from './audit/audit-summary-report/pf-summary-report/pf-summary-report.component';
import { CMPEsicSummaryReportComponent } from './audit/audit-summary-report/esic-summary-report/esic-summary-report.component';
import { CMPAuditVarianceReportComponent } from './audit/audit-variance-report/audit-variance-report.component';
import { CustomAdvanceComponent } from './report/advance/custom-advance/custom-advance.component';
import { FormTwentytwoComponent } from './report/advance/form-twentytwo/form-twentytwo.component';
import { FormCComponent } from './report/advance/form-c/form-c.component';
import { RegisterFormTwentythreeComponent } from './report/overtime-report/register-form-twentythree/register-form-twentythree.component';
import { OtIndividualComponent } from './report/overtime-report/ot-individual/ot-individual.component';
import { OtFormfourComponent } from './report/overtime-report/ot-formfour/ot-formfour.component';
import { CMPEmployeeKpiAppraisalComponent } from './employees/form/employee-kpi-appraisal/employee-kpi-appraisal.component';
import { CMPApplyAppraisalComponent } from './appraisal/apply-appraisal/apply-appraisal.component';
import { CMPApplyAppraisalRatingDetailComponent } from './appraisal/apply-appraisal/apply-appraisal-rating-detail/apply-appraisal-rating-detail.component';
import { CMPAppraisalReportComponent } from './appraisal/appraisal-report/appraisal-report.component';
import { CMPExportAppraisalReportComponent } from './appraisal/appraisal-report/export-appraisal-report/export-appraisal-report.component';
import { EarnedLeaveReportComponent } from './report/leave-encash-report-lising/earned-leave-report/earned-leave-report.component';
import { FormJLeaveRegComponent } from './report/leave-encash-report-lising/form-j-leave-reg/form-j-leave-reg.component';
import { FormFifteenComponent } from './report/leave-encash-report-lising/form-fifteen/form-fifteen.component';
import { LwfComponent } from './report/lwf/lwf.component';
import { CustomReportComponent } from './report/overtime-report/custom-report/custom-report.component';
import { ShiftEarningReportComponent } from './shifts/shift-earning-report/shift-earning-report.component';
import { ShiftDutyReportComponent } from './shifts/shift-duty-report/shift-duty-report.component';
import { TdsCustomReportComponent } from './tds/tds-custom-report/tds-custom-report.component';
import { CMPAdvanceReportViewComponent } from './advancemanagement/advance-listing-console/advance-report-view/advance-report-view.component';
import { FormEComponent } from './report/leave-encash-report-lising/form-e/form-e.component';
import { RevisionHistoryComponent } from './revisionmanagement/revision-history/revision-history.component';
import { RevisionIndividualComponent } from './revisionmanagement/revision-individual/revision-individual.component';
import { ArrearReportComponent } from './revisionmanagement/arrear-report/arrear-report.component';
import { BankInstructionComponent } from './report/leave-encash-report-lising/bank-instruction/bank-instruction.component';
import { InvoiceComponent } from './invoice/invoice-report-listing/invoice.component';
import { ReimbursementComponent } from './reimbursement/reimbursement.component';
import { ReimbursementBankComponent } from './reimbursement-bank/reimbursement-bank.component';
import { RunReimbursementComponent } from './run-reimbursement/run-reimbursement.component';
import { ExtraEarningRunComponent } from './extra-earning-run/extra-earning-run.component';
import { ExtraEarningReportComponent } from './extra-earning-report/extra-earning-report.component';
import { TdsLibraryComponent } from './tds-library/tds-library.component';
import { SummaryBriefcaseComponent } from './audit/audit-summary-report/summary-briefcase/summary-briefcase.component';
import { PendingTdsComponent } from './pending-tds/pending-tds.component';
import { ViewPendingTdsComponent } from './view-pending-tds/view-pending-tds.component';
import { BonusSlipReportViewComponent } from './bonusmanagement/bonus-slip/bonus-slip-report-view/bonus-slip-report-view.component';
import { CMPGeoFenceComponent } from './master/geo-fence/geo-fence.component';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { AgmCoreModule } from '@agm/core';
import { ViewLocationMapComponent } from './master/geo-fence/view-location-map/view-location-map.component';
import { ConsumptionHistoryComponent } from './invoice/consumption-history/consumption-history.component';
import { PurchaseHistoryListingComponent } from './invoice/purchase-history-listing/purchase-history-listing.component';
import { FullAndFinalHistoryComponent } from './govtForms&Registers/full-and-final-history/full-and-final-history.component';
import { PaymentRequiredComponent } from './payment-required/payment-required.component';
import { ApplyReimbursementComponent } from './apply-reimbursement/apply-reimbursement.component';
import { FormAComponent } from './employees/employee-list/form-A/form-A.component';
import { AttendanceFormDReportExportComponent } from './report/attendance-report/attendance-form-d-report-export/attendance-form-d-report-export.component';
import { GratuityFormLComponent } from './govtForms&Registers/gratuity-Form-L/gratuity-Form-L.component';
import { Esic37and7aComponent } from './govtForms&Registers/esic37and7a/esic37and7a.component';
import { PtaxReturnDataComponent } from './govtForms&Registers/ptax-return-data/ptax-return-data.component';
import { UploadFileExcelContributionComponent } from './compliance/upload-file-excel-contribution/upload-file-excel-contribution.component';
import { BulkKycUploadFileComponent } from './compliance/bulk-kyc-upload-file/bulk-kyc-upload-file.component';
import { FormLTemplateComponent } from './govtForms&Registers/gratuity-Form-L/form-L-template/form-l-template.component';
import { SalaryCertificateComponent } from './employees/employee-list/salary-certificate/salary-certificate.component';
import { Esic37and7aTempComponent } from './govtForms&Registers/esic37and7a/esic37and7a-template/esic37nd7a.component';
import { EmployeeVaultComponent } from './employees/form/employee-vault/employee-vault.component';
import { EmployeeVaultDocDetailComponent } from './employees/form/employee-vault-doc-detail/employee-vault-doc-detail.component';
import { HomeEditComponent } from './home-edit/home-edit.component';
import {TdsDeduction} from '../companyuser/tds-deduction/tds-deduction.component'
// import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {CdkDrag} from '@angular/cdk/drag-drop';

@NgModule({
  imports: [
    DragDropModule,
    CommonModule,
    CompanyUserRoutes,
    SelectDropDownModule,
    NgxSpinnerModule,
    DpDatePickerModule,
    AmazingTimePickerModule,
    CKEditorModule,
    NgChartsModule,
    IncludesModule,
    NgxNumToWordsModule,
    // GooglePlaceModule
    GooglePlaceModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyDq5_JgCjfSCHG6SyfDCdL08rcAUhvdVPc',
    }),
  ],
  exports: [CMPEmployeeDetailsFormComponent, CMPEmployeeFormNavbarComponent],
  declarations: [
    CMPHomeComponent,
    CompanyuserDashboardHeaderComponent,
    CompanyuserDashboardFooterComponent,
    CompanyuserDashboardSidebarComponent,
    CompanyuserDashboardTopbarComponent,
    CMPProfileComponent,
    CMPEpfoRulesComponent,
    CMPEsicRulesComponent,
    CMPBonusRulesComponent,
    CMPGratuityRulesComponent,
    CMPPtaxRuleComponent,
    CMPTdsRuleComponent,
    CMPEmployeeListComponent,
    CMPEmployeeDetailsFormComponent,
    CMPEmployeeFormNavbarComponent,
    CMPEmployeeAddressFormComponent,
    CMPEmployeeBankFormComponent,
    CMPDepartmentComponent,
    CMPDesignationComponent,
    CMPDispensaryComponent,
    CMPEmployeeEmploymentFormComponent,
    CMPEmployeeHrdetailsFormComponent,
    CMPEmployeeFamilyFormComponent,
    CMPRolesComponent,
    CMPStaffsComponent,
    CMPEmployeeTrainingattendantFormComponent,
    CMPEmployeeOtherdetailsFormComponent,
    CMPEmployeeDisciplinaryFormComponent,
    CMPEmployeeContractFormComponent,
    CMPEmployeeAccidentdetailsFormComponent,
    CMPEmployeeExtracurriculumFormComponent,
    CMPEmployeeEducationFormComponent,
    CMPAttendancePolicyComponent,
    CMPBonusPolicyComponent,
    CMPIncentivePolicyComponent,
    CMPOvertimePolicyComponent,
    CMPEmployeePackagesComponent,
    CMPSalaryTemplateComponent,
    CMPArrearslipTemplateComponent,
    CMPEmployeeAssetsFormComponent,
    CMPUnauthorizedAccessErrorComponent,
    CMPPayslipTemplateComponent,
    CMPBonusslipTemplateComponent,
    CMPAttendanceWeeklyHolidayComponent,
    CMPAttendanceYearlyHolidayComponent,
    CMPAttendanceConfigurationComponent,
    CMPAttendanceEditComponent,
    CMPAttendanceRegisterTypeComponent,
    CMPLeaveHeadsComponent,
    CMPLeaveTemplateComponent,
    CMPLeaveRuleComponent,
    CMPLwfRuleComponent,
    CMPSalaryCalculatorComponent,
    CMPSettingsComponent,
    CMPAttendanceDailyDetailsComponent,
    CMPClientComponent,
    CMPShiftsSetupComponent,
    CMPShiftAddComponent,
    CMPShiftRateComponent,
    CMPShiftBatchComponent,
    CMPLetterWritingComponent,
    CMPBankPaymentComponent,
    CMPBonusAppliedComponent,
    CMPSalarySheetReportComponent,
    CMPIncentiveListComponent,
    CMPEmployeeAnnualcomponentFormComponent,
    CMPExtraDeductionComponent,
    CMPAdvanceManagementComponent,
    CMPExtraDeductionHeadMasterComponent,
    CMPSalaryHoldsReportComponent,
    CMPMasterSheetReportComponent,
    CMPEditRevisionComponent,
    CMPRunRevisionComponent,
    CMPArrearReportComponent,
    CMPInstructionReportComponent,
    CMPInstructionReportDataComponent,
    CMPChallanReportComponent,
    CMPChallanReportDataComponent,
    CMPChallanReportDataConfirmComponent,
    CompanyuserTableFilterComponent,
    CMPEmployeeFullfinalFormComponent,
    CMPSalaryTemplateDetailsModalComponent,
    CMPEmployeePackageDetailsComponent,
    CMPEmployeeSalarytempDetailsComponent,
    CMPEmployeePrintComponent,
    BonusReportComponent,
    CMPMasterSheetReportRefactorComponent,
    CMPBonusAppliedRefactorComponent,
    CMPIncentiveListRefactorComponent,
    CMPSalarySheetReportNewComponent,
    CMPMasterSheetReportNewComponent,
    CMPPayslipNewComponent,
    CMListingConsoleComponent,
    CMPChallanReportDataNewComponent,
    CMPAttendanceListingConsoleComponent,
    CMPIncentiveReportListingComponent,
    CMPAdvanceListingConsoleComponent,
    CMPBonusReportListingComponent,
    CMPBonusSlipComponent,
    CMPBonusRunComponent,
    CMPOvertimeReportComponent,
    CMPAttendanceFunnelUploadComponent,
    CMPOvertimeRunComponent,
    CMPLayoffListingComponent,
    CMPTdsReportListingComponent,
    CMPLeaveReportListingComponent,
    CMPShiftReportListingComponent,
    CMPApplyApproveTdsComponent,
    CMPApplyLayoffComponent,
    CMPAdvanceRunComponent,
    CMPAttendanceFunnelUploadCsvComponent,
    CMPPayslipPrintComponent,
    CMPItaxSlabsComponent,
    CMPItaxCategoriesComponent,
    EmployeeTdsComponent,
    RevisionReportComponent,
    SmtpComponent,
    TdsTemplateComponent,
    AttendanceReportComponent,
    FormDComponent,
    LateReportDetailComponent,
    LateReportSummaryComponent,
    MonthWiseSummaryComponent,
    SummaryReportComponent,
    CMPPrintLayoffListingComponent,
    CMPFormBWageRegisterComponent,
    WholeDayComponent,
    TimeReportComponent,
    HalfDayComponent,
    LeaveEncashmentComponent,
    LeaveEncashReportLisingComponent,
    LeaveLedgerReportComponent,
    DetailReportComponent,
    CMPAttendanceReportPrintComponent,
    CMPPfBulkTemplateComponent,
    LeaveComponent,
    DetailComponent,
    ExtraDeductionComponent,
    CMPIncentiveViewReportComponent,
    CMPCompliancePfReportComponent,
    CMPCompliancePtReportComponent,
    CMPComplianceEsicReportComponent,
    AdvanceComponent,
    CMPAuditSummaryReportComponent,
    CMPPfSummaryReportComponent,
    CMPEsicSummaryReportComponent,
    CMPAuditVarianceReportComponent,
    CustomAdvanceComponent,
    FormTwentytwoComponent,
    FormCComponent,
    RegisterFormTwentythreeComponent,
    OtIndividualComponent,
    OtFormfourComponent,
    CMPEmployeeKpiAppraisalComponent,
    CMPApplyAppraisalComponent,
    CMPApplyAppraisalRatingDetailComponent,
    CMPAppraisalReportComponent,
    CMPExportAppraisalReportComponent,
    EarnedLeaveReportComponent,
    FormJLeaveRegComponent,
    FormFifteenComponent,
    LwfComponent,
    CustomReportComponent,
    ShiftEarningReportComponent,
    ShiftDutyReportComponent,
    TdsCustomReportComponent,
    CMPAdvanceReportViewComponent,
    FormEComponent,
    RevisionHistoryComponent,
    RevisionIndividualComponent,
    ArrearReportComponent,
    BankInstructionComponent,
    InvoiceComponent,
    ReimbursementComponent,
    ReimbursementBankComponent,
    RunReimbursementComponent,
    ExtraEarningRunComponent,
    ExtraEarningReportComponent,
    TdsLibraryComponent,
    SummaryBriefcaseComponent,
    PendingTdsComponent,
    ViewPendingTdsComponent,
    BonusSlipReportViewComponent,
    CMPGeoFenceComponent,
    ViewLocationMapComponent,
    PurchaseHistoryListingComponent,
    ConsumptionHistoryComponent,
    FullAndFinalHistoryComponent,
    PaymentRequiredComponent,
    ApplyReimbursementComponent,
    FormAComponent,
    AttendanceFormDReportExportComponent,
    GratuityFormLComponent,
    Esic37and7aComponent,
    PtaxReturnDataComponent,
    UploadFileExcelContributionComponent,
    BulkKycUploadFileComponent,
    FormLTemplateComponent,
    SalaryCertificateComponent,
    Esic37and7aTempComponent,
    EmployeeVaultComponent,
    EmployeeVaultDocDetailComponent,
    HomeEditComponent,
    TdsDeduction
  ],
})
export class CompanyUserModule {}
