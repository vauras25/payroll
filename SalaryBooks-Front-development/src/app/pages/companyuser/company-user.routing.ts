import { Routes, RouterModule } from '@angular/router';
import { CMPAdvanceListingConsoleComponent } from './advancemanagement/advance-listing-console/advance-listing-console.component';
import { CMPAdvanceManagementComponent } from './advancemanagement/advance/advance.component';
import { CMPAttendanceListingConsoleComponent } from './attendance/attendance-listing-console/attendance-listing-console.component';
import { CMPAttendanceConfigurationComponent } from './attendance/configuration/configuration.component';
import { CMPAttendanceDailyDetailsComponent } from './attendance/daily-details/daily-details.component';
import { CMPAttendanceEditComponent } from './attendance/edit/edit.component';
import { CMPAttendanceRegisterTypeComponent } from './attendance/register-type/register-type.component';
import { CMPAttendanceWeeklyHolidayComponent } from './attendance/weekly-holiday/weekly-holiday.component';
import { CMPAttendanceYearlyHolidayComponent } from './attendance/yearly-holiday/yearly-holiday.component';
import { CMPAttendanceFunnelUploadComponent } from './attendancefunnel/upload/upload.component';
import { CMPBonusAppliedRefactorComponent } from './bonusmanagement/bonus-applied copy/bonus-applied-refactor.component';
import { CMPBonusAppliedComponent } from './bonusmanagement/bonus-applied/bonus-applied.component';
import { CMPBonusReportListingComponent } from './bonusmanagement/bonus-report-listing/bonus-report-listing.component';
import { BonusReportComponent } from './bonusmanagement/bonus-report/bonus-report.component';
import { CMPBonusRunComponent } from './bonusmanagement/bonus-run/bonus-run.component';
import { CMPBonusSlipComponent } from './bonusmanagement/bonus-slip/bonus-slip.component';
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
import { CMPPayslipTemplateModalComponent } from './companyrules/payslip-template/payslip-template-modal/payslip-template-modal.component';
import { CMPPayslipTemplateComponent } from './companyrules/payslip-template/payslip-template.component';
import { CMPPtaxRuleComponent } from './companyrules/ptax-rule/ptax-rule.component';
import { CMPTdsRuleComponent } from './companyrules/tds-rule/tds-rule.component';
import { CMListingConsoleComponent } from './compliance/compliance-listing-console/compliance-listing-console.component';
import { CMPEmployeeListComponent } from './employees/employee-list/employee-list.component';
import { CMPEmployeePrintComponent } from './employees/employee-print/employee-print.component';
import { CMPExtraDeductionComponent } from './employees/extra-deduction/extra-deduction.component';
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
import { CMPUnauthorizedAccessErrorComponent } from './errors/unauthorized-access/unauthorized-access.component';
import { CMPBonusRulesComponent } from './govtrules/bonus-rules/bonus-rules.component';
import { CMPEpfoRulesComponent } from './govtrules/epfo-rules/epfo-rules.component';
import { CMPEsicRulesComponent } from './govtrules/esic-rules/esic-rules.component';
import { CMPGratuityRulesComponent } from './govtrules/gratuity-rules/gratuity-rules.component';
import { CMPHomeComponent } from './home/home.component';
import { CMPIncentiveListRefactorComponent } from './incentivemanagment/incentive-list copy/incentive-list-refactor.component';
import { CMPIncentiveListComponent } from './incentivemanagment/incentive-list/incentive-list.component';
import { CMPIncentiveReportListingComponent } from './incentivemanagment/incentive-report-listing/incentive-report-listing.component';
import { CMPApplyLayoffComponent } from './layoff/apply-layoff/apply-layoff.component';
import { CMPBankPaymentComponent } from './master/bank-payment/bank-payment.component';
import { CMPClientComponent } from './master/client/client.component';
import { CMPDepartmentComponent } from './master/department/department.component';
import { CMPDesignationComponent } from './master/designation/designation.component';
import { CMPDispensaryComponent } from './master/dispensary/dispensary.component';
import { CMPLetterWritingComponent } from './master/letter-writing/letter-writing.component';
import { CMPEmployeePackagesComponent } from './packages/employee-packages/employee-packages.component';
import { CMPProfileComponent } from './profile/profile.component';
import { CMPArrearReportComponent } from './report/arrear-report/arrear-report.component';
import { CMPChallanReportDataNewComponent } from './report/challan-report-data new/challan-report-data-new.component';
import { CMPChallanReportDataConfirmComponent } from './report/challan-report-data-confirm/challan-report-data-confirm.component';
import { CMPChallanReportDataComponent } from './report/challan-report-data/challan-report-data.component';
import { CMPChallanReportComponent } from './report/challan-report/challan-report.component';
import { CMPInstructionReportDataComponent } from './report/instruction-report-data/instruction-report-data.component';
import { CMPInstructionReportComponent } from './report/instruction-report/instruction-report.component';
import { CMPLayoffListingComponent } from './report/layoff-listing/layoff-listing.component';
import { CMPLeaveReportListingComponent } from './report/leave-report-listing/leave-report-listing.component';
import { CMPMasterSheetReportRefactorComponent } from './report/master-sheet refactor/master-sheet-refactor.component';
import { CMPMasterSheetReportNewComponent } from './report/master-sheet-new/master-sheet-new.component';
import { CMPMasterSheetReportComponent } from './report/master-sheet/master-sheet.component';
import { CMPOvertimeReportComponent } from './report/overtime-report/overtime-report.component';
import { CMPOvertimeRunComponent } from './report/overtime-run/overtime-run.component';
import { CMPPayslipNewComponent } from './report/payslip-new/payslip-new.component';
import { CMPSalaryHoldsReportComponent } from './report/salary-holds/salary-holds.component';
import { CMPSalarySheetReportNewComponent } from './report/salary-sheet-new/salary-sheet-new.component';
import { CMPSalarySheetReportComponent } from './report/salary-sheet/salary-sheet.component';
import { CMPShiftReportListingComponent } from './report/shift-report-listing/shift-report-listing.component';
import { CMPTdsReportListingComponent } from './report/tds-report-listing/tds-report-listing.component';
import { CMPEditRevisionComponent } from './revisionmanagement/edit-revision/edit-revision.component';
import { CMPRunRevisionComponent } from './revisionmanagement/run-revision/run-revision.component';
import { CMPRolesComponent } from './roles/roles.component';
import { CMPSalaryCalculatorComponent } from './salary-calculator/salary-calculator.component';
import { CMPSalaryTemplateComponent } from './salary-template/salary-template.component';
import { CMPSettingsComponent } from './settings/settings.component';
import { CMPShiftAddComponent } from './shifts/shift-add/shift-add.component';
import { CMPShiftBatchComponent } from './shifts/shift-batch/shift-batch.component';
import { CMPShiftRateComponent } from './shifts/shift-rate/shift-rate.component';
import { CMPShiftsSetupComponent } from './shifts/shifts-setup/shifts-setup.component';
import { CMPStaffsComponent } from './staffs/staffs.component';
import { CMPApplyApproveTdsComponent } from './tds/apply-approve-tds/apply-approve-tds.component';
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
import { CMPPrintLayoffListingComponent } from './layoff/print-layoff-listing/print-layoff-listing.component';
import { CMPFormBWageRegisterComponent } from './govtForms&Registers/FormB-wage-register/FormB-wage-register.component';
import { LeaveEncashmentComponent } from './report/leave-encashment/leave-encashment.component';
import { LeaveEncashReportLisingComponent } from './report/leave-encash-report-lising/leave-encash-report-lising.component';
import { LeaveLedgerReportComponent } from './report/leave-ledger-report/leave-ledger-report.component';
import { CMPAttendanceReportPrintComponent } from './attendance/attendance-listing-console/attendance-report-print/attendance-report-print.component';
import { CMPPfBulkTemplateComponent } from './employees/employee-list/pf-bulk-template/pf-bulk-template.component';
import { LeaveComponent } from './approval/leave/leave.component';
import { ExtraDeductionComponent } from './approval/extra-deduction/extra-deduction.component';
import { CMPIncentiveViewReportComponent } from './incentivemanagment/incentive-report-listing/incentive-view-report/incentive-view-report.component';
import { CMPCompliancePfReportComponent } from './compliance/compliance-pf-report/compliance-pf-report.component';
import { CMPCompliancePtReportComponent } from './compliance/compliance-pt-report/compliance-pt-report.component';
import { CMPComplianceEsicReportComponent } from './compliance/compliance-esic-report/compliance-esic-report.component';
import { AdvanceComponent } from './approval/advance/advance.component';
import { CMPAuditSummaryReportComponent } from './audit/audit-summary-report/audit-summary-report.component';
import { CMPAuditVarianceReportComponent } from './audit/audit-variance-report/audit-variance-report.component';
import { OtIndividualComponent } from './report/overtime-report/ot-individual/ot-individual.component';
import { OtFormfourComponent } from './report/overtime-report/ot-formfour/ot-formfour.component';
import { CMPEmployeeKpiAppraisalComponent } from './employees/form/employee-kpi-appraisal/employee-kpi-appraisal.component';
import { CMPApplyAppraisalComponent } from './appraisal/apply-appraisal/apply-appraisal.component';
import { CMPApplyAppraisalRatingDetailComponent } from './appraisal/apply-appraisal/apply-appraisal-rating-detail/apply-appraisal-rating-detail.component';
import { CMPAppraisalReportComponent } from './appraisal/appraisal-report/appraisal-report.component';
import { LwfComponent } from './report/lwf/lwf.component';
import { ShiftEarningReportComponent } from './shifts/shift-earning-report/shift-earning-report.component';
import { ShiftDutyReportComponent } from './shifts/shift-duty-report/shift-duty-report.component';
import { CMPAdvanceReportViewComponent } from './advancemanagement/advance-listing-console/advance-report-view/advance-report-view.component';
import { RevisionIndividualComponent } from './revisionmanagement/revision-individual/revision-individual.component';
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
import { CMPGeoFenceComponent } from './master/geo-fence/geo-fence.component';
import { PurchaseHistoryListingComponent } from './invoice/purchase-history-listing/purchase-history-listing.component';
import { ConsumptionHistoryComponent } from './invoice/consumption-history/consumption-history.component';
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
import { SalaryCertificateComponent } from './employees/employee-list/salary-certificate/salary-certificate.component';
import { EmployeeVaultComponent } from './employees/form/employee-vault/employee-vault.component';
import { EmployeeVaultDocDetailComponent } from './employees/form/employee-vault-doc-detail/employee-vault-doc-detail.component';
import { HomeEditComponent } from './home-edit/home-edit.component';
import { TdsDeduction } from './tds-deduction/tds-deduction.component';


const routes: Routes = [
    { path: '', component: CMPHomeComponent, },
    { path: 'payment-required', component: PaymentRequiredComponent },

      { path: 'profile', component: CMPProfileComponent },

      { path: 'role-access/manage-roles', component: CMPRolesComponent },

      { path: 'staff/manage', component: CMPStaffsComponent },

      { path: 'govt-rules/epfo-rules', component: CMPEpfoRulesComponent },
      { path: 'govt-rules/esic-rules', component: CMPEsicRulesComponent },
      { path: 'govt-rules/bonus-rules', component: CMPBonusRulesComponent },
      { path: 'govt-rules/gratuity-rules', component: CMPGratuityRulesComponent },
      { path: 'govt-rules/itax-slabs', component: CMPItaxSlabsComponent },
      { path: 'govt-rules/itax-categories', component: CMPItaxCategoriesComponent },

      { path: 'company-rules/attendance-policy', component: CMPAttendancePolicyComponent },
      { path: 'company-rules/incentive-policy', component: CMPIncentivePolicyComponent },
      { path: 'company-rules/bonus-policy', component: CMPBonusPolicyComponent },
      { path: 'company-rules/payslip-template', component: CMPPayslipTemplateComponent },
      { path: 'company-rules/payslip-template-modal', component: CMPPayslipTemplateModalComponent },
      { path: 'company-rules/bonusslip-template', component: CMPBonusslipTemplateComponent },
      { path: 'company-rules/arrearslip-template', component: CMPArrearslipTemplateComponent },
      { path: 'company-rules/overtime-policy', component: CMPOvertimePolicyComponent },
      { path: 'company-rules/tds-template', component: CMPTdsRuleComponent },
      { path: 'company-rules/ptax-rule', component: CMPPtaxRuleComponent },
      { path: 'company-rules/lwf-rule', component: CMPLwfRuleComponent },

      { path: 'company-rules/leave-policy/heads', component: CMPLeaveHeadsComponent },
      { path: 'company-rules/leave-policy/template-defination', component: CMPLeaveTemplateComponent },
      { path: 'company-rules/leave-policy/define-rule', component: CMPLeaveRuleComponent },
      { path: 'smtp', component: SmtpComponent },
      { path: 'geo-fence', component: CMPGeoFenceComponent },

      { path: 'package/employee-packages', component: CMPEmployeePackagesComponent },

      { path: 'employees', component: CMPEmployeeListComponent },
      { path: 'employees/form-a', component: FormAComponent },
      { path: 'employees/form-b', component: CMPEmployeeListComponent },
      { path: 'employees/salary-certificate', component: SalaryCertificateComponent },

      { path: 'employee/extra-deduction', component: CMPExtraDeductionComponent },

      { path: 'employees/add', component: CMPEmployeeDetailsFormComponent },
      { path: 'tds-rule', component: TdsTemplateComponent },
      { path: 'tds-template/:id', component: TdsTemplateComponent },

      { path: 'invoice', component: InvoiceComponent },
      { path: 'purchase-history', component: PurchaseHistoryListingComponent },
      { path: 'consumption-history', component: ConsumptionHistoryComponent },

      { path: 'employees/:employee_id/view/details', component: CMPEmployeeDetailsFormComponent },
      { path: 'employees/:employee_id/view/address', component: CMPEmployeeAddressFormComponent },
      { path: 'employees/:employee_id/view/bank', component: CMPEmployeeBankFormComponent },
      { path: 'employees/:employee_id/view/employment', component: CMPEmployeeEmploymentFormComponent },
      { path: 'employees/:employee_id/view/hr-details', component: CMPEmployeeHrdetailsFormComponent },
      { path: 'employees/:employee_id/view/family', component: CMPEmployeeFamilyFormComponent },
      { path: 'employees/:employee_id/view/training-attended', component: CMPEmployeeTrainingattendantFormComponent },
      { path: 'employees/:employee_id/view/other-details', component: CMPEmployeeOtherdetailsFormComponent },
      { path: 'employees/:employee_id/view/disciplinary-actions', component: CMPEmployeeDisciplinaryFormComponent },
      { path: 'employees/:employee_id/view/contract-details', component: CMPEmployeeContractFormComponent },
      { path: 'employees/:employee_id/view/accident-details', component: CMPEmployeeAccidentdetailsFormComponent },
      { path: 'employees/:employee_id/view/extra-curricular', component: CMPEmployeeExtracurriculumFormComponent },
      { path: 'employees/:employee_id/view/educational-details', component: CMPEmployeeEducationFormComponent },
      { path: 'employees/:employee_id/view/employee-vault', component: EmployeeVaultComponent },
      { path: 'employees/:employee_id/view/employee-vault/doc/:id', component: EmployeeVaultDocDetailComponent },
      { path: 'employees/:employee_id/view/assets', component: CMPEmployeeAssetsFormComponent },
      { path: 'employees/:employee_id/view/fullfinal', component: CMPEmployeeFullfinalFormComponent },

      { path: 'employees/:employee_id/edit/details', component: CMPEmployeeDetailsFormComponent },
      { path: 'employees/:employee_id/edit/address', component: CMPEmployeeAddressFormComponent },
      { path: 'employees/:employee_id/edit/bank', component: CMPEmployeeBankFormComponent },
      { path: 'employees/:employee_id/edit/employment', component: CMPEmployeeEmploymentFormComponent },
      { path: 'employees/:employee_id/edit/hr-details', component: CMPEmployeeHrdetailsFormComponent },
      { path: 'employees/:employee_id/edit/family', component: CMPEmployeeFamilyFormComponent },
      { path: 'employees/:employee_id/edit/training-attended', component: CMPEmployeeTrainingattendantFormComponent },
      { path: 'employees/:employee_id/edit/other-details', component: CMPEmployeeOtherdetailsFormComponent },
      { path: 'employees/:employee_id/edit/disciplinary-actions', component: CMPEmployeeDisciplinaryFormComponent },
      { path: 'employees/:employee_id/edit/contract-details', component: CMPEmployeeContractFormComponent },
      { path: 'employees/:employee_id/edit/accident-details', component: CMPEmployeeAccidentdetailsFormComponent },
      { path: 'employees/:employee_id/edit/extra-curricular', component: CMPEmployeeExtracurriculumFormComponent },
      { path: 'employees/:employee_id/edit/educational-details', component: CMPEmployeeEducationFormComponent },
      { path: 'employees/:employee_id/edit/employee-vault', component: EmployeeVaultComponent },
      { path: 'employees/:employee_id/edit/employee-vault/doc/:id', component: EmployeeVaultDocDetailComponent },
      { path: 'employees/:employee_id/edit/assets', component: CMPEmployeeAssetsFormComponent },
      { path: 'employees/:employee_id/edit/annual-component', component: CMPEmployeeAnnualcomponentFormComponent },
      { path: 'employees/:employee_id/edit/fullfinal', component: CMPEmployeeFullfinalFormComponent },
      { path: 'employees/:employee_id/print', component: CMPEmployeePrintComponent },
      { path: 'employees/:employee_id/tds', component: EmployeeTdsComponent },
      { path: 'employees/:employee_id/edit/kpi-details', component: CMPEmployeeKpiAppraisalComponent },

      { path: 'master/department', component: CMPDepartmentComponent },
      { path: 'master/designation', component: CMPDesignationComponent },
      { path: 'master/dispensary', component: CMPDispensaryComponent },
      { path: 'master/client', component: CMPClientComponent },
      { path: 'master/letter', component: CMPLetterWritingComponent },
      { path: 'master/payment-bank', component: CMPBankPaymentComponent },

      { path: 'salary-template', component: CMPSalaryTemplateComponent },
      { path: 'salary-calculator', component: CMPSalaryCalculatorComponent },

      { path: 'attendance-management/weekly-holiday', component: CMPAttendanceWeeklyHolidayComponent },
      { path: 'attendance-management/yearly-holiday', component: CMPAttendanceYearlyHolidayComponent },
      { path: 'attendance-management/configuration', component: CMPAttendanceConfigurationComponent },
      { path: 'attendance-management/daily-details', component: CMPAttendanceDailyDetailsComponent },
      { path: 'attendance-management/edit', component: CMPAttendanceEditComponent },
      { path: 'attendance-management/register-type', component: CMPAttendanceRegisterTypeComponent },
      { path: 'attendance-management/attendance-listing-console', component: CMPAttendanceListingConsoleComponent },
      { path: 'attendance-management/attendance-report/print', component: CMPAttendanceReportPrintComponent },
      { path: 'attendance-management/form-d/print', component: AttendanceFormDReportExportComponent },


      { path: 'attendance-funnel/upload', component: CMPAttendanceFunnelUploadComponent },
      { path: 'attendance-funnel/upload-csv', component: CMPAttendanceFunnelUploadCsvComponent },

      { path: 'settings', component: CMPSettingsComponent },

      { path: 'shift-management/setup', component: CMPShiftsSetupComponent },
      { path: 'shift-management/add', component: CMPShiftAddComponent },
      { path: 'shift-management/rate', component: CMPShiftRateComponent },
      { path: 'shift-management/batch', component: CMPShiftBatchComponent },
      { path: 'shift-management/earning-report', component: ShiftEarningReportComponent },
      { path: 'shift-management/duty-report', component: ShiftDutyReportComponent },

      { path: 'bonus-management/applied', component: CMPBonusAppliedComponent },
      { path: 'bonus-management/run', component: CMPBonusRunComponent },
      { path: 'bonus-management/applied-refactor', component: CMPBonusAppliedRefactorComponent },
      { path: 'bonus-management/report', component: BonusReportComponent },
      { path: 'bonus-management/report-listing', component:CMPBonusReportListingComponent },
      { path: 'bonus-management/slip', component:CMPBonusSlipComponent },

      { path: 'incentive-management/list', component: CMPIncentiveListComponent },
      { path: 'incentive-management/list-refactor', component: CMPIncentiveListRefactorComponent },
      { path: 'incentive-management/report-listing', component: CMPIncentiveReportListingComponent },

      { path: 'advance-management/manage', component: CMPAdvanceManagementComponent },
      { path: 'advance-management/run', component: CMPAdvanceRunComponent },
      { path: 'advance-management/listing-console', component: CMPAdvanceListingConsoleComponent },
      { path: 'advance-management/report', component: CMPAdvanceReportViewComponent },

      { path: 'reports/salary-sheet', component: CMPSalarySheetReportComponent },
      { path: 'reports/salary-sheet-new', component: CMPSalarySheetReportNewComponent },
      { path: 'reports/master-sheet', component: CMPMasterSheetReportComponent },
      { path: 'reports/master-sheet-refactor', component: CMPMasterSheetReportRefactorComponent },
      { path: 'reports/master-sheet-new', component: CMPMasterSheetReportNewComponent },
      { path: 'reports/payslip', component: CMPPayslipNewComponent },
      { path: 'reports/payslip/:employee_id/print', component: CMPPayslipPrintComponent },
      { path: 'reports/salary-holds', component: CMPSalaryHoldsReportComponent },
      { path: 'reports/arrear-report', component: CMPArrearReportComponent },
      { path: 'reports/instruction-report', component: CMPInstructionReportComponent },
      { path: 'reports/instruction-report/data', component: CMPInstructionReportDataComponent },
      { path: 'reports/leave-encashment', component: LeaveEncashmentComponent },
      { path: 'reports/pf-challan-report', component: CMPChallanReportComponent },
      { path: 'reports/pf-challan-report/data', component: CMPChallanReportDataComponent },
      { path: 'reports/pf-challan-report/data-new', component: CMPChallanReportDataNewComponent },
      { path: 'reports/esic-challan-report/data-new', component: CMPChallanReportDataNewComponent },
      { path: 'reports/pf-challan-report/data/:fileId/confirm', component: CMPChallanReportDataConfirmComponent },
      { path: 'reports/compliance-listing-console', component: CMListingConsoleComponent },
      { path: 'reports/compliance/pf-report', component:CMPCompliancePfReportComponent   },
      { path: 'reports/compliance/pt-report', component: CMPCompliancePtReportComponent  },
      { path: 'reports/compliance/esic-report', component:CMPComplianceEsicReportComponent  },
      { path: 'reports/compliance/bulk-kyc-upload-file', component:BulkKycUploadFileComponent  },
      { path: 'reports/compliance/upload-file-excel-contribution', component:UploadFileExcelContributionComponent  },


      { path: 'reports/esic-challan-report', component: CMPChallanReportComponent },
      { path: 'reports/esic-challan-report/data', component: CMPChallanReportDataComponent },
      { path: 'reports/esic-challan-report/data/:fileId/confirm', component: CMPChallanReportDataConfirmComponent },

      { path: 'revision-management/manage', component: CMPEditRevisionComponent },
      { path: 'revision-management/new-report', component: RevisionReportComponent },
      { path: 'revision-management/run', component: CMPRunRevisionComponent },
      { path: 'revision-management/emp/:id', component: RevisionIndividualComponent },

      { path: 'reports/master-sheet-new', component: CMPMasterSheetReportNewComponent },

      { path: 'reports/attendance-report', component: AttendanceReportComponent },

      { path: 'reports/leave-ledger-report', component: LeaveLedgerReportComponent },
      { path: 'reports/lwf-report', component: LwfComponent },


      { path: 'overtime/run', component:CMPOvertimeRunComponent},
      { path: 'overtime/report', component:CMPOvertimeReportComponent},
      { path: 'overtime/individual-report/:detail', component:OtIndividualComponent},
      { path: 'overtime/form-four/:detail', component:OtFormfourComponent},


      {path:'layoff/report', component:CMPLayoffListingComponent},
      {path:'tds/report', component:CMPTdsReportListingComponent},
      {path:'leave/report', component:CMPLeaveReportListingComponent},
      {path:'leave/encashment', component:LeaveEncashReportLisingComponent},

      {path:'shift-management/report', component:CMPShiftReportListingComponent},
      {path:'tds/apply-approve', component:CMPApplyApproveTdsComponent},
      {path:'layoff/apply', component:CMPApplyLayoffComponent},

      { path: 'errors/unauthorized-access', component: CMPUnauthorizedAccessErrorComponent },

      { path: 'reports/layoff-listing/print', component: CMPPrintLayoffListingComponent },

      { path: 'govt-forms/wage-reister-wage-b', component: CMPFormBWageRegisterComponent },

      {path:'employees/pf-bulk/:action', component:CMPPfBulkTemplateComponent},
      {path:'approval/leave', component:LeaveComponent},
      {path:'approval/extra-deduction', component:ExtraDeductionComponent},
      {path:'approval/reimbursement', component:ReimbursementComponent},
      {path:'approval/tds-declaretion', component:PendingTdsComponent},
      {path:'approval/tds-view/:employee_id', component:ViewPendingTdsComponent},

      {path:'reimbursement/apply', component:ApplyReimbursementComponent},
      {path:'reimbursement/bank-instruction', component:ReimbursementBankComponent},
      {path:'reimbursement/run', component:RunReimbursementComponent},

      {path:'extra-earning/run', component:ExtraEarningRunComponent},
      {path:'extra-earning/bank-instruction', component:ExtraEarningReportComponent},

      {path:'approval/advance-request', component:AdvanceComponent},

      {path:'incentive-management/incentive-report/view', component:CMPIncentiveViewReportComponent},

      {path:'audit/summary-report/pf', component:CMPAuditSummaryReportComponent},
      {path:'audit/summary-report/esic', component:CMPAuditSummaryReportComponent},
      {path:'audit/variance-report', component:CMPAuditVarianceReportComponent},
      {path:'audit/summary-briefcase', component:SummaryBriefcaseComponent},

      {path:'appraisal/apply-appraisal', component:CMPApplyAppraisalComponent},
      {path:'appraisal/apply-appraisal/rating-details/:emp_id', component:CMPApplyAppraisalRatingDetailComponent},
      {path:'appraisal/appraisal-report', component:CMPAppraisalReportComponent},
      {path:'tds-library', component:TdsLibraryComponent},

      {path:'govt-forms/full-and-final-history', component:FullAndFinalHistoryComponent},
      {path:'govt-forms/gratuity-form-l', component:GratuityFormLComponent  },
      {path:'govt-forms/esic-37-and-7a', component:Esic37and7aComponent  },
      {path:'govt-forms/ptax-return-data', component:PtaxReturnDataComponent  },
       { path: 'home-edit', component: HomeEditComponent },
       { path: 'approval/tds-deduction', component: TdsDeduction },
];

export const CompanyUserRoutes = RouterModule.forChild(routes);
