import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ADHomeComponent } from './home/home.component';
import { AdminDashboardFooterComponent } from './includes/dashboard-footer/dashboard-footer.component';
import { AdminDashboardHeaderComponent } from './includes/dashboard-header/dashboard-header.component';
import { AdminDashboardRightbarComponent } from './includes/dashboard-rightbar/dashboard-rightbar.component';
import { AdminDashboardSidebarComponent } from './includes/dashboard-sidebar/dashboard-sidebar.component';
import { AdminDashboardTopbarComponent } from './includes/dashboard-topbar/dashboard-topbar.component';
import { ADPromotionManagementComponent } from './promotion-management/promotion-management.component';
import { AdminLayoutComponent } from '../layouts/admin/admin.component';
import { ADClientpackagesComponent } from './clientpackages/clientpackages.component';
import { ADArrearslipTemplateComponent } from './companyrules/arrearslip-template/arrearslip-template.component';
import { ADAttendancePolicyComponent } from './companyrules/attendance-policy/attendance-policy.component';
import { ADBonusPolicyComponent } from './companyrules/bonus-policy/bonus-policy.component';
import { ADBonusslipTemplateComponent } from './companyrules/bonusslip-template/bonusslip-template.component';
import { ADIncentivePolicyComponent } from './companyrules/incentive-policy/incentive-policy.component';
import { ADOvertimePolicyComponent } from './companyrules/overtime-policy/overtime-policy.component';
import { ADPayslipTemplateComponent } from './companyrules/payslip-template/payslip-template.component';
import { ADPtaxRuleComponent } from './companyrules/ptax-rule/ptax-rule.component';
import { ADTdsRuleComponent } from './companyrules/tds-rule/tds-rule.component';
import { ADBonusRulesComponent } from './govtrules/bonus-rules/bonus-rules.component';
import { ADEpfoRulesComponent } from './govtrules/epfo-rules/epfo-rules.component';
import { ADEsicRulesComponent } from './govtrules/esic-rules/esic-rules.component';
import { ADGratuityRulesComponent } from './govtrules/gratuity-rules/gratuity-rules.component';
import { ADItaxCategoriesComponent } from './govtrules/itax-categories/itax-categories.component';
import { ADItaxSlabsComponent } from './govtrules/itax-slabs/itax-slabs.component';
import { ADBranchComponent } from './master/branch/branch.component';
import { ADDepartmentComponent } from './master/department/department.component';
import { ADDesignationComponent } from './master/designation/designation.component';
import { ADResellerComponent } from './master/reseller/reseller.component';
import { ADProfileComponent } from './profile/profile.component';
import { ADRolesComponent } from './roles/roles.component';
import { ADSubadminsComponent } from './subadmins/subadmins.component';
import { ADSubscriptionPlansComponent } from './subscription/subscription-plans/subscription-plans.component';
import { ADSubscriptionUsersComponent } from './subscription/subscription-users/subscription-users.component';
import { ADLeaveRuleComponent } from './companyrules/leave-rule/leave-rule.component';
import { ADLwfRuleComponent } from './companyrules/lwf-rule/lwf-rule.component';
import { ADSalaryTemplateComponent } from './companyrules/salary-template/salary-template.component';
import { ADCreditInvoiceComponent } from './master/credit-invoice/credit-invoice.component';
import { ADSubscriptionCreditComponent } from './subscription/subscription-credit/subscription-credit.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { DataTablesModule } from 'angular-datatables';
import { NgChartsModule } from 'ng2-charts';
import { DpDatePickerModule } from 'ng2-date-picker';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IncludesModule } from '../includes/includes.module';
import { AdminRoutes } from './admin.routing';
import { ADLPageConfigComponent } from './landing-page-config/L-page-config/L-page-config.component';
import { ADLPostsComponent } from './landing-page-config/L-posts/L-posts.component';
import { ADLSettingsComponent } from './landing-page-config/L-settings/L-settings.component';
import { ADLMembershipComponent } from './landing-page-config/L-membership/L-membership.component';
import { SmtpComponent } from './smtp/smtp.component';
import { InvoiceComponent } from './invoice/invoice/invoice.component';
import { CompanyLedgerComponent } from './company-ledger/company-ledger.component';
import { LedgerDetailComponent } from './company-ledger/ledger-detail/ledger-detail.component';
import { CreditUsageComponent } from './credit-usage/credit-usage.component';
import { CreditUsageDetailComponent } from './credit-usage/credit-usage-detail/credit-usage-detail.component';
import { SalesLedgerComponent } from './sales-ledger/sales-ledger.component';
import { TdsRulesComponent } from './tds-rules/tds-rules.component';
import { TdsRuleDeclarationComponent } from './tds-rule-declaration/tds-rule-declaration.component';
import { CreditInvoiceViewComponent } from './master/credit-invoice/credit-invoice-view/credit-invoice-view.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutes,
    SelectDropDownModule,
    NgxSpinnerModule,
    DpDatePickerModule,
    CKEditorModule,
    IncludesModule,
    NgChartsModule,
    
  ],
  declarations: [
    AdminLayoutComponent,
    ADHomeComponent,
    // ADHomeComponent,
    AdminDashboardHeaderComponent,
    AdminDashboardFooterComponent,
    AdminDashboardSidebarComponent,
    AdminDashboardTopbarComponent,
    AdminDashboardRightbarComponent,
    ADDepartmentComponent,
    ADBranchComponent,
    ADDesignationComponent,
    ADRolesComponent,
    ADSubadminsComponent,
    ADProfileComponent,
    ADResellerComponent,
    ADEpfoRulesComponent,
    ADEsicRulesComponent,
    ADBonusRulesComponent,
    ADGratuityRulesComponent,
    ADItaxSlabsComponent,
    ADClientpackagesComponent,
    ADSubscriptionPlansComponent,
    ADSubscriptionUsersComponent,
    AdminLayoutComponent,
    ADAttendancePolicyComponent,
    ADItaxCategoriesComponent,
    ADIncentivePolicyComponent,
    ADBonusPolicyComponent,
    ADOvertimePolicyComponent,
    ADPayslipTemplateComponent,
    ADBonusslipTemplateComponent,
    ADArrearslipTemplateComponent,
    ADTdsRuleComponent,
    ADPtaxRuleComponent,
    ADPromotionManagementComponent,
    ADSubscriptionCreditComponent,
    ADLwfRuleComponent,
    ADCreditInvoiceComponent,
    ADSalaryTemplateComponent,
    ADLeaveRuleComponent,
    ADLPageConfigComponent,
    ADLPostsComponent,
    ADLSettingsComponent,
    ADLMembershipComponent,
    SmtpComponent,
    InvoiceComponent,
    CompanyLedgerComponent,
    LedgerDetailComponent,
    CreditUsageComponent,
    CreditUsageDetailComponent,
    SalesLedgerComponent,
    TdsRulesComponent,
    TdsRuleDeclarationComponent,
    CreditInvoiceViewComponent
  ],
})

export class AdminModule {}
